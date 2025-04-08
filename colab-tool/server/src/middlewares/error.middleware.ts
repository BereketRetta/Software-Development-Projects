// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Error response interface
 */
interface ErrorResponse {
  message: string;
  stack?: string;
}

/**
 * Custom error class with status code
 */
export class ApiError extends Error {
  statusCode: number;
  
  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Not found middleware
 * Handles 404 errors for routes that don't exist
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new ApiError(404, `Route not found - ${req.originalUrl}`);
  next(error);
};

/**
 * Error handling middleware
 * Provides consistent error responses
 */
export const errorHandler = (
  err: ApiError, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  // Default to 500 server error
  const statusCode = err.statusCode || 500;
  
  const errorResponse: ErrorResponse = {
    message: err.message || 'Server Error',
  };
  
  // Add stack trace in development mode
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }
  
  res.status(statusCode).json(errorResponse);
};