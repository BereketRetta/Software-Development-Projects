# E-Commerce Platform with Microservices Architecture

A sophisticated e-commerce web application built with a microservices architecture, showcasing advanced architectural patterns and modern web technologies.

![Homepage Screenshot](<screenshots/homepage.svg>)
![Cart Screenshot](<screenshots/shopping.svg>)

## Project Overview

This project implements a complete e-commerce platform with the following components:

- Microservices-based backend using Node.js and Express with TypeScript
- React frontend with TypeScript for the web client
- MongoDB for database storage
- Redis for caching and session management
- RabbitMQ for inter-service communication
- Docker for containerization
- JWT-based authentication and authorization

## Architecture

The application is designed with the following microservices:

1. **API Gateway**: Entry point for all client requests, handling routing and authentication
2. **Authentication Service**: User registration, login, and JWT management
3. **Product Service**: Product catalog management including categories, search, and inventory
4. **Order Service**: Order processing, cart management, and checkout
5. **Payment Service**: Integration with payment gateways (simulated)
6. **Notification Service**: Email/SMS notifications for orders and account activities

## Technologies Used

### Backend
- Node.js with Express
- TypeScript
- MongoDB with Mongoose
- RabbitMQ for message queuing
- JWT for authentication
- Joi for validation

### Frontend
- React with TypeScript
- React Router for navigation
- TailwindCSS for styling
- Axios for API communication

### DevOps
- Docker and Docker Compose
- Nginx for the web server

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)

### Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/bereketretta/ecommerce-platform.git
   cd ecommerce-platform
   ```

2. Start the application using Docker Compose:
   ```
   docker-compose up
   ```

3. Access the application:
   - Web client: http://localhost
   - API Gateway: http://localhost:8000

## Development

### Running Services Individually

Each service can be run independently for development:

1. Navigate to the service directory:
   ```
   cd services/auth-service
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the service:
   ```
   npm run dev
   ```

## API Documentation

### Authentication Service
- **POST /auth/register**: Register a new user
- **POST /auth/login**: Authenticate a user and receive JWT
- **GET /auth/profile**: Get current user profile

### Product Service
- **GET /products**: List all products with filtering and pagination
- **GET /products/:id**: Get a specific product
- **POST /products**: Create a new product (admin only)
- **PUT /products/:id**: Update a product (admin only)
- **DELETE /products/:id**: Delete a product (admin only)

### Order Service
- **GET /cart**: View current user's cart
- **POST /cart/items**: Add an item to cart
- **PUT /cart/items/:productId**: Update cart item quantity
- **DELETE /cart/items/:productId**: Remove item from cart
- **POST /checkout**: Create an order from the cart
- **GET /orders**: List user's orders
- **GET /orders/:id**: Get a specific order

## Features

- **User Authentication**: Secure registration and login with JWT
- **Product Catalog**: Browsing, searching, and filtering products
- **Shopping Cart**: Add, update, and remove items from cart
- **Order Processing**: Complete checkout process with shipping and payment
- **Admin Dashboard**: Manage products, categories, and orders (future implementation)
- **Responsive Design**: Works on desktop and mobile devices
