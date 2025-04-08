import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import ProductList from './components/ProductList';
import Cart from './components/Cart';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [cartItemsCount, setCartItemsCount] = useState<number>(0);

  useEffect(() => {
    checkAuthStatus();
    fetchCartItemsCount();
  }, [isAuthenticated]);

  const checkAuthStatus = async () => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      setIsAuthenticated(false);
      setUser(null);
      setLoading(false);
      return;
    }
    
    try {
      // Set default headers for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      const response = await axios.get('/api/auth/profile');
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Authentication error:', err);
      localStorage.removeItem('token');
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchCartItemsCount = async () => {
    if (!isAuthenticated) {
      setCartItemsCount(0);
      return;
    }
    
    try {
      const response = await axios.get('/api/orders/cart');
      setCartItemsCount(response.data.items.length);
    } catch (err) {
      console.error('Error fetching cart count:', err);
    }
  };

  const handleLogin = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setUser(null);
    setCartItemsCount(0);
  };

  const handleAddToCart = async (productId: string) => {
    if (!isAuthenticated) {
      // Redirect to login
      return;
    }
    
    try {
      await axios.post('/api/orders/cart/items', {
        productId,
        quantity: 1
      });
      
      fetchCartItemsCount();
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const toggleCart = () => {
    setIsCartOpen(!isCartOpen);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-md">
          <div className="container mx-auto p-4 flex justify-between items-center">
            <Link to="/" className="text-xl font-bold">E-Commerce Platform</Link>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={toggleCart}
                className="relative p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                
                {cartItemsCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
              
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <span>Hello, {user?.firstName}</span>
                  <button 
                    onClick={handleLogout}
                    className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div>
                  <Link 
                    to="/login" 
                    className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100 mr-2"
                  >
                    Login
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-transparent border border-white text-white px-3 py-1 rounded hover:bg-white hover:text-blue-600"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-grow">
          <Routes>
            <Route 
              path="/" 
              element={<ProductList onAddToCart={handleAddToCart} />} 
            />
            <Route 
              path="/login" 
              element={
                isAuthenticated ? (
                  <Navigate to="/" />
                ) : (
                  <LoginPage onLogin={handleLogin} />
                )
              } 
            />
            <Route 
              path="/register" 
              element={
                isAuthenticated ? (
                  <Navigate to="/" />
                ) : (
                  <RegisterPage />
                )
              } 
            />
            <Route 
              path="/checkout" 
              element={
                isAuthenticated ? (
                  <CheckoutPage />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/orders" 
              element={
                isAuthenticated ? (
                  <OrdersPage />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
          </Routes>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-800 text-white py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold mb-2">E-Commerce Platform</h3>
                <p className="text-sm text-gray-400">Your one-stop shop for everything</p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Shop</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li><Link to="/" className="hover:text-white">Products</Link></li>
                    <li><Link to="/categories" className="hover:text-white">Categories</Link></li>
                    <li><Link to="/deals" className="hover:text-white">Deals</Link></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Account</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li><Link to="/profile" className="hover:text-white">My Profile</Link></li>
                    <li><Link to="/orders" className="hover:text-white">My Orders</Link></li>
                    <li><Link to="/settings" className="hover:text-white">Settings</Link></li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Info</h4>
                  <ul className="text-sm text-gray-400 space-y-1">
                    <li><Link to="/about" className="hover:text-white">About Us</Link></li>
                    <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
                    <li><Link to="/faq" className="hover:text-white">FAQ</Link></li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-700 text-sm text-gray-400 text-center">
              © {new Date().getFullYear()} E-Commerce Platform. All rights reserved.
            </div>
          </div>
        </footer>
        
        {/* Cart Sidebar */}
        <Cart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </div>
    </Router>
  );
};

// Placeholder components for other pages
const LoginPage: React.FC<{ onLogin: (token: string, userData: User) => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      onLogin(response.data.token, response.data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        
        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
            required
          />
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 px-4 rounded font-medium ${
            loading
              ? 'bg-blue-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      
      <div className="mt-4 text-center">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

const RegisterPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Register</h2>
      <p>Registration form would be here</p>
    </div>
  );
};

const CheckoutPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>
      <p>Checkout form would be here</p>
    </div>
  );
};

const OrdersPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">My Orders</h2>
      <p>Order history would be here</p>
    </div>
  );
};

export default App;