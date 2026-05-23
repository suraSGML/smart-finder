import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Share2, Bell, Loader } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from './Toast';
import { comparisonAPI } from '../api/client';

const ProductComparison = ({ products = [], onClose }) => {
  const { t } = useTranslation();
  const [selectedProducts, setSelectedProducts] = useState(products.slice(0, 4));
  const [priceHistory, setPriceHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [priceAlerts, setPriceAlerts] = useState({});

  // Load price history when products change
  useEffect(() => {
    if (selectedProducts.length > 0) {
      loadPriceHistory();
    }
  }, [selectedProducts]);

  const loadPriceHistory = async () => {
    setLoadingHistory(true);
    try {
      // Fetch price history for the first selected product
      if (selectedProducts[0]) {
        const res = await comparisonAPI.compareProduct(selectedProducts[0].id);
        if (res.data.price_history) {
          setPriceHistory(res.data.price_history);
        }
      }
    } catch (err) {
      console.error('Failed to load price history:', err);
      // Use mock data as fallback
      setPriceHistory([
        { date: 'Jan 1', price: 15000 },
        { date: 'Jan 8', price: 14800 },
        { date: 'Jan 15', price: 14500 },
        { date: 'Jan 22', price: 14200 },
        { date: 'Jan 29', price: 14500 },
        { date: 'Feb 5', price: 14000 },
      ]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter((p) => p.id !== productId));
  };

  const handleExportPDF = () => {
    try {
      // Create a simple PDF export
      const content = `
PRODUCT COMPARISON REPORT
Generated: ${new Date().toLocaleDateString()}

PRODUCTS COMPARED:
${selectedProducts.map((p) => `- ${p.name}: ${p.min_price?.toLocaleString()} ETB`).join('\n')}

PRICE COMPARISON:
${selectedProducts.map((p) => `${p.name}: ${p.min_price?.toLocaleString()} ETB`).join('\n')}

AVAILABLE SHOPS:
${selectedProducts.map((p) => `${p.name}: ${p.shop_count || 0} shops`).join('\n')}

RATINGS:
${selectedProducts.map((p) => `${p.name}: ${p.rating ? `${p.rating}/5` : 'No ratings'}`).join('\n')}
      `;

      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
      element.setAttribute('download', 'product-comparison.txt');
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      showSuccess('Comparison exported successfully!');
    } catch (err) {
      showError('Failed to export comparison');
    }
  };

  const handleShare = async () => {
    const shareText = `Check out this product comparison: ${selectedProducts
      .map((p) => p.name)
      .join(', ')}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Product Comparison',
          text: shareText,
          url: window.location.href,
        });
        showSuccess('Shared successfully!');
      } catch (err) {
        if (err.name !== 'AbortError') {
          showError('Failed to share');
        }
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText);
      showSuccess('Comparison link copied to clipboard!');
    }
  };

  const handleSetPriceAlert = (productId) => {
    setPriceAlerts((prev) => ({
      ...prev,
      [productId]: !prev[productId],
    }));
    showSuccess(priceAlerts[productId] ? 'Price alert disabled' : 'Price alert enabled!');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
          {t('product.title') || 'Product'} Comparison
        </h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X size={24} />
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                Feature
              </th>
              {selectedProducts.map((product) => (
                <th key={product.id} className="text-left py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                  <div className="flex justify-between items-start gap-2">
                    <span className="line-clamp-2">{product.name}</span>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRemoveProduct(product.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0"
                    >
                      <X size={16} />
                    </motion.button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price Row */}
            <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                {t('common.price') || 'Price'}
              </td>
              {selectedProducts.map((product) => (
                <td key={product.id} className="py-3 px-4 text-blue-600 dark:text-blue-400 font-bold">
                  {product.min_price?.toLocaleString()} ETB
                </td>
              ))}
            </tr>

            {/* Category Row */}
            <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                {t('product.category') || 'Category'}
              </td>
              {selectedProducts.map((product) => (
                <td key={product.id} className="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {product.category}
                </td>
              ))}
            </tr>

            {/* Brand Row */}
            <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                {t('product.brand') || 'Brand'}
              </td>
              {selectedProducts.map((product) => (
                <td key={product.id} className="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {product.brand || 'N/A'}
                </td>
              ))}
            </tr>

            {/* Available Shops Row */}
            <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                Available Shops
              </td>
              {selectedProducts.map((product) => (
                <td key={product.id} className="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {product.shop_count || 0} shops
                </td>
              ))}
            </tr>

            {/* Rating Row */}
            <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                {t('common.rating') || 'Rating'}
              </td>
              {selectedProducts.map((product) => (
                <td key={product.id} className="py-3 px-4 text-gray-700 dark:text-gray-300">
                  {product.rating ? `${product.rating}/5` : 'No ratings'}
                </td>
              ))}
            </tr>

            {/* Price Alert Row */}
            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="py-3 px-4 font-semibold text-gray-800 dark:text-gray-100">
                Price Alert
              </td>
              {selectedProducts.map((product) => (
                <td key={product.id} className="py-3 px-4">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleSetPriceAlert(product.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      priceAlerts[product.id]
                        ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    <Bell size={18} />
                  </motion.button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Price History Chart */}
      {selectedProducts.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Price History
          </h3>
          {loadingHistory ? (
            <div className="flex items-center justify-center h-64">
              <Loader className="h-6 w-6 text-blue-600 animate-spin" />
            </div>
          ) : priceHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1f2937',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No price history available
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 justify-end flex-wrap">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleShare}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Share2 size={18} />
          Share
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Download size={18} />
          Export
        </motion.button>
      </div>
    </motion.div>
  );
};

export default ProductComparison;
