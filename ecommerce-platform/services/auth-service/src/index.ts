import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import Joi from 'joi';
import { connect as amqpConnect, Connection, Channel } from 'amqplib';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/auth-service';
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';

// Connect to MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create User model
const User = mongoose.model('User', userSchema);

// RabbitMQ setup
let channel: Channel;

const setupRabbitMQ = async () => {
  try {
    const connection: any = await amqpConnect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    // Setup exchanges and queues
    await channel.assertExchange('user-events', 'topic', { durable: true });
    
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
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Routes
// Register
app.post('/register', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: value.email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(value.password, 10);

    // Create new user
    const newUser = new User({
      email: value.email,
      password: hashedPassword,
      firstName: value.firstName,
      lastName: value.lastName
    });

    await newUser.save();

    // Publish user created event
    if (channel) {
      channel.publish(
        'user-events', 
        'user.created', 
        Buffer.from(JSON.stringify({
          userId: newUser._id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }))
      );
    }

    res.status(201).json({ 
      message: 'User registered successfully',
      userId: newUser._id
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Error registering user' });
  }
});

// Login
app.post('/login', async (req: Request, res: Response) => {
  try {
    // Validate request body
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Find user
    const user = await User.findOne({ email: value.email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(value.password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(200).json({
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
});

// Verify token
app.post('/verify', (req: Request, res: Response) => {
  const { token } = req.body;
  
  if (!token) {
    return res.status(400).json({ message: 'Token is required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ valid: true, user: decoded });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid token' });
  }
});

// User profile
app.get('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Profile error:', error);
    
    if ((error as any).name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Error fetching profile' });
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
  console.log(`Auth Service running on port ${PORT}`);
});