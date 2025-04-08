import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Product {
  _id: string;
  name: string;
  description: string;
  price: number;
  salePrice?: number;
  imageUrls: string[];
  stock: number;
}

interface ProductListProps {
  onAddToCart: (productId: string) => void;
}

const ProductList: React.FC<ProductListProps> = ({ onAddToCart }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    fetchProducts();
  }, [currentPage, searchTerm]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', '8');
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await axios.get(`/api/products?${params.toString()}`);
      setProducts(response.data.products);
      setTotalPages(response.data.pagination.pages);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch products');
      setLoading(false);
      console.error('Error fetching products:', err);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAddToCart = (productId: string) => {
    onAddToCart(productId);
  };

  if (loading) {
    return <div className="text-center py-8">Loading products...</div>;
  }

  if (error) {
    return <div className="text-center py-8 text-red-600">{error}</div>;
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto p-4">
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="p-2 border border-gray-300 rounded w-full md:w-1/3"
          />
        </div>
        <div className="text-center py-8">No products found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="p-2 border border-gray-300 rounded w-full md:w-1/3"
        />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <div key={product._id} className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-200 overflow-hidden">
              {product.imageUrls && product.imageUrls.length > 0 ? (
                <img
                  src={product.imageUrls[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2 truncate">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex justify-between items-center">
                <div>
                  {product.salePrice ? (
                    <div>
                      <span className="text-gray-400 line-through mr-2">${product.price.toFixed(2)}</span>
                      <span className="text-red-600 font-bold">${product.salePrice.toFixed(2)}</span>
                    </div>
                  ) : (
                    <span className="font-bold">${product.price.toFixed(2)}</span>
                  )}
                </div>
                
                <button
                  onClick={() => handleAddToCart(product._id)}
                  disabled={product.stock <= 0}
                  className={`px-3 py-1 rounded text-sm ${
                    product.stock > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <div className="flex space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`px-3 py-1 rounded ${
              currentPage === 1
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-1 rounded ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={`px-3 py-1 rounded ${
              currentPage === totalPages
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductList;