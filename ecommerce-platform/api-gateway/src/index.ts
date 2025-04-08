import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// JWT Authentication middleware
const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
      (req as any).user = user;
      next();
    } catch (error) {
      return res.status(403).json({ message: 'Invalid token' });
    }
  } else {
    // For open endpoints, allow passing through
    if (
      req.path.startsWith('/auth/login') || 
      req.path.startsWith('/auth/register') ||
      req.path.startsWith('/products') && req.method === 'GET'
    ) {
      return next();
    }
    
    return res.status(401).json({ message: 'Authentication required' });
  }
};

// Define proxy routes
// Authentication Service
app.use(
  '/auth',
  createProxyMiddleware({
    target: 'http://auth-service:8001',
    changeOrigin: true,
    pathRewrite: {
      '^/auth': '/',
    },
  })
);

// Product Service (public endpoints don't need authentication)
app.use(
  '/products', 
  (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      next(); // Skip authentication for GET requests to products
    } else {
      authenticateJWT(req, res, next); // Authenticate for other methods
    }
  },
  createProxyMiddleware({
    target: 'http://product-service:8002',
    changeOrigin: true,
    pathRewrite: {
      '^/products': '/',
    },
  })
);

// Order Service (requires authentication)
app.use(
  '/orders',
  authenticateJWT,
  createProxyMiddleware({
    target: 'http://order-service:8003',
    changeOrigin: true,
    pathRewrite: {
      '^/orders': '/',
    },
  })
);

// Payment Service (requires authentication)
app.use(
  '/payments',
  authenticateJWT,
  createProxyMiddleware({
    target: 'http://payment-service:8004',
    changeOrigin: true,
    pathRewrite: {
      '^/payments': '/',
    },
  })
);

// Default route
app.get('/', (req: Request, res: Response) => {
  res.send('E-Commerce API Gateway');
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
  console.log(`API Gateway running on port ${PORT}`);
});