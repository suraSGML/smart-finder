import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, Scale } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProductComparison from '../components/ProductComparison';
import { productsAPI } from '../api/client';
import { showError } from '../components/Toast';

const ComparisonPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const compareIds = searchParams.get('compare');
    if (compareIds) {
      loadProducts(compareIds.split(','));
    }
  }, [searchParams]);

  const loadProducts = async (ids) => {
    setLoading(true);
    try {
      const productPromises = ids.map(id => productsAPI.get(id.trim()));
      const responses = await Promise.all(productPromises);
      const loadedProducts = responses.map(res => res.data).filter(Boolean);
      setProducts(loadedProducts);
    } catch (error) {
      console.error('Failed to load products for comparison:', error);
      showError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };


  const handleAddProduct = () => {
    navigate('/search');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Scale size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">No products to compare</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Select products to compare their features and prices.
        </p>
        <button
          onClick={handleAddProduct}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/search')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div className="flex items-center gap-3">
            <Scale size={32} className="text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
              Product Comparison
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {products.length} product{products.length !== 1 ? 's' : ''}
          </span>
          {products.length < 4 && (
            <button
              onClick={handleAddProduct}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <Plus size={16} /> Add Product
            </button>
          )}
        </div>
      </div>

      {/* Comparison Component */}
      <ProductComparison products={products} onClose={() => navigate('/search')} />
    </motion.div>
  );
};

export default ComparisonPage;
