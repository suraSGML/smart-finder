import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Search, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import BarcodeScanner from '../components/BarcodeScanner';
import { showSuccess, showError } from '../components/Toast';
import { productsAPI } from '../api/client';

const BarcodeScannerPage = () => {
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [searching, setSearching] = useState(false);

  const handleScan = async (barcode) => {
    setSearching(true);
    try {
      // Search for product by barcode (this would need backend support)
      // For now, we'll search by name or just navigate to search
      const response = await productsAPI.list({ search: barcode });
      
      if (response.data.results && response.data.results.length > 0) {
        setScannedProduct(response.data.results[0]);
        showSuccess('Product found!');
      } else {
        showError('No product found for this barcode');
      }
    } catch (error) {
      console.error('Search error:', error);
      showError('Failed to search for product');
    } finally {
      setSearching(false);
    }
  };

  const handleViewProduct = () => {
    if (scannedProduct) {
      navigate(`/products/${scannedProduct.id}`);
    }
  };

  const handleSearchMore = () => {
    navigate(`/search?search=${scannedProduct?.name || ''}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {showScanner ? (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto p-6"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Camera size={40} className="text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              Barcode Scanner
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Scan product barcodes to quickly find and compare prices
            </p>
          </div>

          {/* Scanner Button */}
          {!scannedProduct ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowScanner(true)}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-6 rounded-2xl font-semibold text-lg transition-colors shadow-lg"
            >
              <Camera size={24} />
              Start Scanning
            </motion.button>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
              <div className="flex items-start gap-4 mb-4">
                {scannedProduct.image ? (
                  <img
                    src={scannedProduct.image}
                    alt={scannedProduct.name}
                    className="w-24 h-24 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <Package size={32} className="text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-1">
                    {scannedProduct.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    {scannedProduct.brand || 'Unknown Brand'}
                  </p>
                  {scannedProduct.min_price && (
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      ETB {scannedProduct.min_price.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleViewProduct}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
                >
                  View Details
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSearchMore}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 py-3 rounded-xl font-medium transition-colors"
                >
                  <Search size={18} />
                  Search Similar
                </motion.button>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setScannedProduct(null);
                  setShowScanner(true);
                }}
                className="w-full mt-3 flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 py-2 transition-colors"
              >
                <Camera size={18} />
                Scan Another
              </motion.button>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
              How to use
            </h3>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                <span>Tap "Start Scanning" to open the camera</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                <span>Align the barcode within the scanning frame</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                <span>The scanner will automatically detect the barcode</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
                <span>View product details and compare prices</span>
              </li>
            </ul>
          </div>

          {/* Note */}
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
            Note: This is a demo implementation. In production, integrate a barcode scanning library
            like react-qr-reader or html5-qrcode for actual barcode detection.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export default BarcodeScannerPage;
