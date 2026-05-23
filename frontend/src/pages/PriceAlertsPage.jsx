import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Trash2, Plus, AlertTriangle, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api/client';
import { showSuccess, showError } from '../components/Toast';
import { useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';

const PriceAlertsPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [targetPrice, setTargetPrice] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.priceAlerts();
      setAlerts(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch price alerts:', error);
      showError('Failed to load price alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAlerts();
    }
  }, [isAuthenticated]);

  const handleDeleteAlert = async (alertId) => {
    try {
      await usersAPI.deletePriceAlert(alertId);
      showSuccess('Price alert deleted');
      fetchAlerts();
    } catch (error) {
      showError('Failed to delete alert');
    }
  };

  const handleToggleAlert = async (alert) => {
    try {
      await usersAPI.updatePriceAlert(alert.id, { is_active: !alert.is_active });
      showSuccess(alert.is_active ? 'Alert deactivated' : 'Alert activated');
      fetchAlerts();
    } catch (error) {
      showError('Failed to update alert');
    }
  };

  const handleCreateAlert = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !targetPrice) {
      showError('Please select a product and enter a target price');
      return;
    }
    try {
      await usersAPI.createPriceAlert({
        product: selectedProduct.id,
        target_price: parseFloat(targetPrice),
      });
      showSuccess('Price alert created');
      setShowCreateModal(false);
      setSelectedProduct(null);
      setTargetPrice('');
      fetchAlerts();
    } catch (error) {
      showError('Failed to create alert');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Bell size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sign in to view price alerts</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">You need to be logged in to access price alerts.</p>
        <button
          onClick={() => navigate('/login')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          Sign In
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bell size={32} className="text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Price Alerts</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Plus size={16} /> New Alert
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : alerts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg"
        >
          <Bell size={64} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">No price alerts yet</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Set price alerts to get notified when products drop to your desired price.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            Create First Alert
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert, index) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 ${
                alert.is_triggered ? 'border-green-500' : alert.is_active ? 'border-blue-500' : 'border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                      {alert.product_detail?.name || 'Unknown Product'}
                    </h3>
                    {alert.is_triggered ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        <Check size={12} /> Triggered
                      </span>
                    ) : alert.is_active ? (
                      <span className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        <Bell size={12} /> Active
                      </span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Target: ETB {alert.target_price.toLocaleString()}</span>
                    {alert.current_min_price && (
                      <span>Current: ETB {alert.current_min_price.toLocaleString()}</span>
                    )}
                    <span>Created: {new Date(alert.created_at).toLocaleDateString()}</span>
                  </div>
                  {alert.is_triggered && alert.triggered_at && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                      Alert triggered on {new Date(alert.triggered_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {!alert.is_triggered && (
                    <button
                      onClick={() => handleToggleAlert(alert)}
                      className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      title={alert.is_active ? 'Deactivate' : 'Activate'}
                    >
                      {alert.is_active ? <Bell size={18} /> : <Bell size={18} className="opacity-50" />}
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteAlert(alert.id)}
                    className="p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    title="Delete alert"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Alert Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Create Price Alert</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateAlert} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product
                </label>
                <input
                  type="text"
                  placeholder="Search for a product..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  disabled
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select a product from search results (demo - navigate to product page to set alert)
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Target Price (ETB)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  placeholder="Enter target price"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={!selectedProduct || !targetPrice}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Alert
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default PriceAlertsPage;
