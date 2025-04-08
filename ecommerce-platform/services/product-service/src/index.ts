import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Joi from 'joi';
import { connect as amqpConnect, Connection, Channel } from 'amqplib';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/product-service';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Schemas
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  imageUrl: String,
  slug: { type: String, required: true, unique: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  salePrice: { type: Number },
  imageUrls: [{ type: String }],
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  sku: { type: String, required: true, unique: true },
  stock: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  tags: [{ type: String }],
  attributes: { type: Map, of: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);

// RabbitMQ setup
let channel: Channel;

const setupRabbitMQ = async () => {
  try {
    const connection: Connection = await amqpConnect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Setup exchanges and queues
    await channel.assertExchange('product-events', 'topic', { durable: true });
    
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    // Retry connection after delay
    setTimeout(setupRabbitMQ, 5000);
  }
};

setupRabbitMQ();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Define validation schemas
const categorySchema_validation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().allow(''),
  imageUrl: Joi.string().uri().allow(''),
  slug: Joi.string().required(),
  parentId: Joi.string().allow(null, '')
});

const productSchema_validation = Joi.object({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().positive().required(),
  salePrice: Joi.number().positive().allow(null),
  imageUrls: Joi.array().items(Joi.string().uri()),
  categoryId: Joi.string().required(),
  sku: Joi.string().required(),
  stock: Joi.number().integer().min(0),
  isActive: Joi.boolean(),
  tags: Joi.array().items(Joi.string()),
  attributes: Joi.object().pattern(Joi.string(), Joi.string())
});

// Routes
// Category routes
app.get('/categories', async (req: Request, res: Response) => {
  try {
    const categories = await Category.find();
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

app.get('/categories/:id', async (req: Request, res: Response) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    res.status(200).json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

app.post('/categories', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = categorySchema_validation.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Check if slug already exists
    const existingCategory = await Category.findOne({ slug: value.slug });
    if (existingCategory) {
      return res.status(409).json({ message: 'Category with this slug already exists' });
    }
    
    // Create new category
    const newCategory = new Category({
      name: value.name,
      description: value.description,
      imageUrl: value.imageUrl,
      slug: value.slug,
      parentId: value.parentId || null
    });
    
    await newCategory.save();
    
    // Publish category created event
    if (channel) {
      channel.publish(
        'product-events', 
        'category.created', 
        Buffer.from(JSON.stringify(newCategory))
      );
    }
    
    res.status(201).json(newCategory);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

app.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = categorySchema_validation.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Check if slug already exists and is not the current category
    if (value.slug) {
      const existingCategory = await Category.findOne({ 
        slug: value.slug,
        _id: { $ne: req.params.id } 
      });
      
      if (existingCategory) {
        return res.status(409).json({ message: 'Category with this slug already exists' });
      }
    }
    
    // Update category
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      {
        ...value,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Publish category updated event
    if (channel) {
      channel.publish(
        'product-events', 
        'category.updated', 
        Buffer.from(JSON.stringify(updatedCategory))
      );
    }
    
    res.status(200).json(updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

app.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    // Check if category has products
    const productsCount = await Product.countDocuments({ categoryId: req.params.id });
    if (productsCount > 0) {
      return res.status(409).json({ 
        message: 'Cannot delete category with associated products',
        count: productsCount
      });
    }
    
    // Delete category
    const deletedCategory = await Category.findByIdAndDelete(req.params.id);
    
    if (!deletedCategory) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Publish category deleted event
    if (channel) {
      channel.publish(
        'product-events', 
        'category.deleted', 
        Buffer.from(JSON.stringify({ categoryId: req.params.id }))
      );
    }
    
    res.status(200).json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// Product routes
app.get('/products', async (req: Request, res: Response) => {
  try {
    const { 
      category, 
      search, 
      minPrice, 
      maxPrice,
      page = 1,
      limit = 10,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;
    
    // Build query
    const query: any = { isActive: true };
    
    if (category) {
      query.categoryId = category;
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    
    // Pagination
    const skip = (Number(page) - 1) * Number(limit);
    
    // Get products
    const products = await Product.find(query)
      .sort({ [sort as string]: order === 'desc' ? -1 : 1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('categoryId', 'name slug');
    
    // Get total count
    const total = await Product.countDocuments(query);
    
    res.status(200).json({
      products,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

app.get('/products/:id', async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name slug');
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

app.post('/products', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = productSchema_validation.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Check if SKU already exists
    const existingProduct = await Product.findOne({ sku: value.sku });
    if (existingProduct) {
      return res.status(409).json({ message: 'Product with this SKU already exists' });
    }
    
    // Check if category exists
    const category = await Category.findById(value.categoryId);
    if (!category) {
      return res.status(400).json({ message: 'Invalid category' });
    }
    
    // Create new product
    const newProduct = new Product({
      ...value,
      attributes: value.attributes || {}
    });
    
    await newProduct.save();
    
    // Publish product created event
    if (channel) {
      channel.publish(
        'product-events', 
        'product.created', 
        Buffer.from(JSON.stringify(newProduct))
      );
    }
    
    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ message: 'Error creating product' });
  }
});

app.put('/products/:id', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = productSchema_validation.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    
    // Check if SKU already exists and is not the current product
    if (value.sku) {
      const existingProduct = await Product.findOne({ 
        sku: value.sku,
        _id: { $ne: req.params.id } 
      });
      
      if (existingProduct) {
        return res.status(409).json({ message: 'Product with this SKU already exists' });
      }
    }
    
    // Check if category exists
    if (value.categoryId) {
      const category = await Category.findById(value.categoryId);
      if (!category) {
        return res.status(400).json({ message: 'Invalid category' });
      }
    }
    
    // Update product
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...value,
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Publish product updated event
    if (channel) {
      channel.publish(
        'product-events', 
        'product.updated', 
        Buffer.from(JSON.stringify(updatedProduct))
      );
    }
    
    res.status(200).json(updatedProduct);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

app.delete('/products/:id', async (req: Request, res: Response) => {
  try {
    // Delete product
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Publish product deleted event
    if (channel) {
      channel.publish(
        'product-events', 
        'product.deleted', 
        Buffer.from(JSON.stringify({ productId: req.params.id }))
      );
    }
    
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Stock management
app.patch('/products/:id/stock', async (req: Request, res: Response) => {
  try {
    const { quantity } = req.body;
    
    if (quantity === undefined || isNaN(Number(quantity))) {
      return res.status(400).json({ message: 'Valid quantity is required' });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    // Update stock
    product.stock = Math.max(0, product.stock + Number(quantity));
    await product.save();
    
    // Publish stock updated event
    if (channel) {
      channel.publish(
        'product-events', 
        'product.stock.updated', 
        Buffer.from(JSON.stringify({
          productId: product._id,
          sku: product.sku,
          oldStock: product.stock - Number(quantity),
          newStock: product.stock,
          change: Number(quantity)
        }))
      );
    }
    
    res.status(200).json({ 
      productId: product._id,
      sku: product.sku,
      stock: product.stock 
    });
  } catch (error) {
    console.error('Error updating stock:', error);
    res.status(500).json({ message: 'Error updating stock' });
  }
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'UP' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Product Service running on port ${PORT}`);
});