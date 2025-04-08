import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Joi from 'joi';
import { connect as amqpConnect, Connection, Channel } from 'amqplib';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8003;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/order-service';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL || 'http://product-service:8002';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define Schemas
const cartItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  imageUrl: { type: String }
});

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
  phoneNumber: { type: String, required: true }
});

const orderSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  orderNumber: { type: String, required: true, unique: true },
  items: [cartItemSchema],
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  paymentMethod: { type: String, required: true },
  paymentStatus: { 
    type: String, 
    enum: ['pending', 'paid', 'failed', 'refunded'], 
    default: 'pending' 
  },
  orderStatus: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  subtotal: { type: Number, required: true },
  tax: { type: Number, required: true },
  shippingCost: { type: Number, required: true },
  total: { type: Number, required: true },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  items: [cartItemSchema],
  updatedAt: { type: Date, default: Date.now }
});

// Create models
const Order = mongoose.model('Order', orderSchema);
const Cart = mongoose.model('Cart', cartSchema);

// RabbitMQ setup
let channel: Channel;

const setupRabbitMQ = async () => {
  try {
    const connection: any = await amqpConnect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Setup exchanges and queues
    await channel.assertExchange('order-events', 'topic', { durable: true });
    
    // Listen for product stock updates
    await channel.assertExchange('product-events', 'topic', { durable: true });
    const q = await channel.assertQueue('order-service-product-updates', { durable: true });
    
    await channel.bindQueue(q.queue, 'product-events', 'product.stock.updated');
    await channel.bindQueue(q.queue, 'product-events', 'product.updated');
    await channel.bindQueue(q.queue, 'product-events', 'product.deleted');
    
    channel.consume(q.queue, async (msg) => {
      if (msg) {
        try {
          const content = JSON.parse(msg.content.toString());
          const routingKey = msg.fields.routingKey;
          
          console.log(`Received message with routing key: ${routingKey}`);
          
          // Handle product deleted
          if (routingKey === 'product.deleted' && content.productId) {
            // Remove the product from all carts
            await Cart.updateMany(
              { 'items.productId': content.productId },
              { $pull: { items: { productId: content.productId } } }
            );
          }
          
          // Handle product updated (price change)
          if (routingKey === 'product.updated' && content._id) {
            // Update product details in all carts
            const carts = await Cart.find({ 'items.productId': content._id });
            
            for (const cart of carts) {
              for (let i = 0; i < cart.items.length; i++) {
                if (cart.items[i].productId === content._id) {
                  cart.items[i].name = content.name;
                  cart.items[i].price = content.price;
                  cart.items[i].imageUrl = content.imageUrls && content.imageUrls.length > 0 
                    ? content.imageUrls[0] 
                    : null;
                }
              }
              await cart.save();
            }
          }
          
          channel.ack(msg);
        } catch (error) {
          console.error('Error processing message:', error);
          channel.nack(msg, false, true); // Requeue the message
        }
      }
    });
    
    console.log('Connected to RabbitMQ');
  } catch (error) {
    console.error('RabbitMQ connection error:', error);
    // Retry connection after delay
    setTimeout(setupRabbitMQ, 5000);
  }
};