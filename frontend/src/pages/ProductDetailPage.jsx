/**
 * Product detail page: shows product info, all shops carrying it, and comparison.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Package, Loader, AlertCircle, ShoppingBag, Bell } from 'lucide-react';
import ComparisonTable from '../components/ComparisonTable';
import ProductReviews from '../components/ProductReviews';
import SocialShare from '../components/SocialShare';
import { productsAPI, comparisonAPI, usersAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { addRecentlyViewed } from '../utils/recentlyViewed';
import { showSuccess, showError } from '../components/Toast';

const ProductDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [targetPrice, setTargetPrice] = useState('');

  const userLat = user?.latitude || null;
  const userLon = user?.longitude || null;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch product details
        const productRes = await productsAPI.get(id);
        setProduct(productRes.data);
        
        // Track recently viewed
        addRecentlyViewed(productRes.data);

        // Fetch comparison data
        const params = {};
        if (userLat) params.lat = userLat;
        if (userLon) params.lon = userLon;
        const comparisonRes = await comparisonAPI.compareProduct(id, params);
        setComparison(comparisonRes.data);
      } catch (err) {
        const status = err.response?.status;
        if (status === 404) {
          setError('Product not found.');
        } else if (status === 401) {
          setError('You must be logged in to view this product.');
        } else if (status === 403) {
          setError('You do not have permission to view this product.');
        } else {
          setError('Failed to load product. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, userLat, userLon]);

  const handleCreatePriceAlert = async () => {
    if (!user) {
      showError('Please log in to set price alerts');
      return;
    }
    try {
      await usersAPI.createPriceAlert({
        product: parseInt(id),
        target_price: parseFloat(targetPrice),
      });
      showSuccess('Price alert created successfully!');
      setShowAlertModal(false);
      setTargetPrice('');
    } catch (error) {
      showError('Failed to create price alert');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-10 w-10 text-blue-600 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600 mb-6">{error || 'Product not found.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-6 font-medium"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        {/* Product header */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Product image */}
            <div className="md:col-span-1">
              <div className="bg-gray-100 rounded-lg overflow-hidden h-64 flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="h-20 w-20 text-gray-300" aria-hidden="true" />
                )}
              </div>
            </div>

            {/* Product info */}
            <div className="md:col-span-2">
              <div className="mb-4">
                <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full mb-2 ${
                  product.category === 'ELECTRONICS' ? 'bg-blue-100 text-blue-700' :
                  product.category === 'FOOD' ? 'bg-green-100 text-green-700' :
                  product.category === 'CLOTHING' ? 'bg-pink-100 text-pink-700' :
                  product.category === 'HOUSEHOLD' ? 'bg-yellow-100 text-yellow-700' :
                  product.category === 'HEALTH' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {product.category_display || product.category}
                </span>
              </div>

              <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>

              {product.brand && (
                <p className="text-gray-500 mb-4">Brand: <span className="font-medium">{product.brand}</span></p>
              )}

              {product.description && (
                <p className="text-gray-600 mb-6 leading-relaxed">{product.description}</p>
              )}

              {/* Price range */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="text-sm text-gray-600 mb-1">Price Range</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold text-blue-700">
                    ETB {product.min_price ? Number(product.min_price).toLocaleString() : 'N/A'}
                  </span>
                  {product.max_price && product.max_price !== product.min_price && (
                    <>
                      <span className="text-gray-500">–</span>
                      <span className="text-2xl font-bold text-gray-700">
                        ETB {Number(product.max_price).toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
                {product.unit && (
                  <p className="text-xs text-gray-500 mt-2">Unit: {product.unit}</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setShowAlertModal(true)}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  <Bell size={18} />
                  Set Price Alert
                </button>
                <SocialShare
                  title={product.name}
                  description={product.description}
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-800">{product.shop_count || 0}</div>
                  <div className="text-xs text-gray-500">Shop{product.shop_count !== 1 ? 's' : ''} Available</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-gray-800">{product.tags_list?.length || 0}</div>
                  <div className="text-xs text-gray-500">Tags</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {product.tags_list && product.tags_list.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {product.tags_list.map((tag, i) => (
                <span
                  key={i}
                  className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price comparison */}
        {comparison && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Where to Buy: {product.name}
            </h2>
            <ComparisonTable comparison={comparison.comparison} productName={product.name} />
          </div>
        )}

        {/* No shops message */}
        {comparison && comparison.comparison.ranked.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <ShoppingBag className="h-12 w-12 text-gray-300 mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-500 text-lg">No shops currently carrying this product.</p>
          </div>
        )}

        {/* Product Reviews */}
        <ProductReviews productId={id} />
      </div>

      {/* Price Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Set Price Alert</h3>
            <p className="text-gray-600 mb-4">
              Get notified when the price drops below your target amount.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Price (ETB)
              </label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
                placeholder="Enter target price"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCreatePriceAlert}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create Alert
              </button>
              <button
                onClick={() => setShowAlertModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;
