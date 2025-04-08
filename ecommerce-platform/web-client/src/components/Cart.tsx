import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

interface CartProps {
  isOpen: boolean;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchCartItems();
    }
  }, [isOpen]);

  const fetchCartItems = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to view your cart');
        setLoading(false);
        return;
      }
      
      const response = await axios.get('/api/orders/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCartItems(response.data.items);
      setTotal(response.data.total);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch cart items');
      setLoading(false);
      console.error('Error fetching cart:', err);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to update your cart');
        return;
      }
      
      if (quantity < 1) {
        removeItem(productId);
        return;
      }
      
      const response = await axios.put(`/api/orders/cart/items/${productId}`, 
        { quantity },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setCartItems(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Error updating cart item:', err);
      setError('Failed to update item quantity');
    }
  };

  const removeItem = async (productId: string) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to remove items');
        return;
      }
      
      const response = await axios.delete(`/api/orders/cart/items/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCartItems(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Error removing cart item:', err);
      setError('Failed to remove item from cart');
    }
  };

  const clearCart = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to clear your cart');
        return;
      }
      
      const response = await axios.delete('/api/orders/cart', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setCartItems(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
    }
  };

  const proceedToCheckout = () => {
    onClose();
    navigate('/checkout');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-lg flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Cart</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-8">Loading cart...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">{error}</div>
          ) : cartItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Your cart is empty</div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex border-b pb-4">
                  <div className="w-20 h-20 bg-gray-200 mr-4 flex-shrink-0">
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt={item.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-grow">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-gray-600">${item.price.toFixed(2)}</p>
                    
                    <div className="mt-2 flex items-center">
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded-l"
                      >
                        -
                      </button>
                      <span className="w-10 h-8 flex items-center justify-center border-t border-b">
                        {item.quantity}
                      </span>
                      <button 
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="w-8 h-8 flex items-center justify-center border rounded-r"
                      >
                        +
                      </button>
                      
                      <button 
                        onClick={() => removeItem(item.productId)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t">
          <div className="flex justify-between mb-4">
            <span className="font-semibold">Total:</span>
            <span className="font-semibold">${total.toFixed(2)}</span>
          </div>
          
          <div className="space-y-2">
            <button
              onClick={proceedToCheckout}
              disabled={cartItems.length === 0}
              className={`w-full py-2 rounded font-medium ${
                cartItems.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Proceed to Checkout
            </button>
            
            <button
              onClick={clearCart}
              disabled={cartItems.length === 0}
              className={`w-full py-2 rounded font-medium ${
                cartItems.length === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              }`}
            >
              Clear Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;