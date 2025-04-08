// src/server.ts
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { setupSocketHandlers } from './socket';
import authRoutes from './routes/auth.routes';
import documentRoutes from './routes/document.routes';
import { notFoundHandler, errorHandler } from './middlewares/error.middleware';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:19006'], // Web and mobile
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

// Basic route for API status
app.get('/', (req, res) => {
  res.send('Collaboration Tool API is running');
});

// Set up socket handlers
setupSocketHandlers(io);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Close server & exit process
  server.close(() => process.exit(1));
});