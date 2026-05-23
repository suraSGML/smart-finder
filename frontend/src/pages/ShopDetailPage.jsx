/**
 * Shop detail page: info, products, reviews, and map.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Globe, Star, Package, Clock, AlertCircle } from 'lucide-react';
import StarRating from '../components/StarRating';
import MapView from '../components/MapView';
import SkeletonLoader from '../components/SkeletonLoader';
import { shopsAPI, productsAPI, reviewsAPI, analyticsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ShopDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [shop, setShop] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [shopRes, inventoryRes, reviewsRes] = await Promise.all([
          shopsAPI.get(id),
          productsAPI.shopInventory(id),
          reviewsAPI.shopReviews(id),
        ]);
        setShop(shopRes.data);
        setInventory(inventoryRes.data.results || inventoryRes.data);
        setReviews(reviewsRes.data.results || reviewsRes.data);

        // Track shop view
        analyticsAPI.trackShopView(id).catch(() => {});
      } catch (err) {
        const status = err.response?.status;
        if (status === 403) {
          setError('This shop is pending approval and not yet publicly visible.');
        } else if (status === 404) {
          setError('Shop not found.');
        } else if (status === 401) {
          setError('You must be logged in to view this shop.');
        } else {
          setError('Failed to load shop. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.rating) {
      setReviewError('Please select a rating.');
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    try {
      const res = await reviewsAPI.create({ shop: parseInt(id), rating: reviewForm.rating, comment: reviewForm.comment });
      setReviews((prev) => [res.data, ...prev]);
      setReviewForm({ rating: 0, comment: '' });
      // Refresh shop to get updated rating
      try {
        const shopRes = await shopsAPI.get(id);
        setShop(shopRes.data);
      } catch (refreshErr) {
        console.error('Failed to refresh shop data after review:', refreshErr);
        // Don't fail the whole review submission if refresh fails
      }
    } catch (err) {
      console.error('Review submission error:', err);
      setReviewError(
        err.response?.data?.non_field_errors?.[0] ||
        Object.values(err.response?.data || {}).flat()[0] ||
        err.response?.data?.detail ||
        'Failed to submit review.'
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SkeletonLoader type="shop" count={1} />
        <div className="mt-6">
          <SkeletonLoader type="product" count={4} />
        </div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" aria-hidden="true" />
        <p className="text-gray-600">{error || 'Shop not found.'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const ratingNum = parseFloat(shop.rating) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover image */}
      <div className="h-48 bg-gradient-to-r from-blue-700 to-blue-500 relative overflow-hidden">
        {shop.cover_image && (
          <img src={shop.cover_image} alt="" className="w-full h-full object-cover opacity-50" />
        )}
      </div>

      <div className="max-w-7xl mx-auto px-4">
        {/* Shop header */}
        <div className="bg-white rounded-xl shadow-md -mt-12 relative z-10 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-blue-100 flex items-center justify-center flex-shrink-0 border-4 border-white shadow">
              {shop.logo ? (
                <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-blue-600">{shop.name.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-800">{shop.name}</h1>
              <div className="flex items-center gap-1 mt-1">
                <StarRating value={ratingNum} readOnly size="sm" />
                <span className="text-sm font-medium text-gray-700">{ratingNum.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({shop.review_count} reviews)</span>
              </div>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {shop.address}, {shop.city}
                </span>
                {shop.phone && (
                  <a href={`tel:${shop.phone}`} className="flex items-center gap-1 hover:text-blue-600">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    {shop.phone}
                  </a>
                )}
                {shop.website && (
                  <a href={shop.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-600">
                    <Globe className="h-4 w-4" aria-hidden="true" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
          {shop.description && (
            <p className="mt-4 text-gray-600 text-sm">{shop.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 mb-6 bg-white rounded-t-xl px-4">
              {['products', 'reviews'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 text-sm font-medium border-b-2 transition-colors capitalize ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab} {tab === 'products' ? `(${inventory.length})` : `(${reviews.length})`}
                </button>
              ))}
            </div>

            {/* Products tab */}
            {activeTab === 'products' && (
              <div className="space-y-3">
                {inventory.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                    <Package className="h-10 w-10 mx-auto mb-2 text-gray-300" aria-hidden="true" />
                    <p>No products listed yet.</p>
                  </div>
                ) : (
                  inventory.map((sp) => (
                    <div key={sp.id} className="bg-white rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {sp.product_detail?.image ? (
                          <img src={sp.product_detail.image} alt={sp.product_detail.name} className="w-full h-full object-cover" />
                        ) : (
                          <Package className="w-full h-full p-3 text-gray-300" aria-hidden="true" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-800 truncate">
                          {sp.product_detail?.name || 'Product'}
                        </h3>
                        <p className="text-xs text-gray-500">{sp.product_detail?.category_display}</p>
                        {sp.notes && <p className="text-xs text-blue-600 mt-0.5">{sp.notes}</p>}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-blue-700 text-lg">
                          ETB {Number(sp.price).toLocaleString()}
                        </div>
                        <span className={`text-xs font-medium ${sp.availability ? 'text-green-600' : 'text-red-500'}`}>
                          {sp.availability ? '✓ In Stock' : '✗ Out of Stock'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Reviews tab */}
            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {/* Write review form */}
                {isAuthenticated && (
                  <div className="bg-white rounded-xl p-5 shadow-sm">
                    <h3 className="font-semibold text-gray-800 mb-3">Write a Review</h3>
                    <form onSubmit={handleSubmitReview}>
                      <div className="mb-3">
                        <label className="block text-sm text-gray-600 mb-1">Your Rating</label>
                        <StarRating
                          value={reviewForm.rating}
                          onChange={(r) => setReviewForm((f) => ({ ...f, rating: r }))}
                          size="lg"
                          showLabel
                        />
                      </div>
                      <textarea
                        value={reviewForm.comment}
                        onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                        placeholder="Share your experience with this shop..."
                        className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                        rows={3}
                      />
                      {reviewError && (
                        <p className="text-red-500 text-sm mt-1">{reviewError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={submittingReview}
                        className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                      >
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                    </form>
                  </div>
                )}

                {/* Reviews list */}
                {reviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                    <Star className="h-10 w-10 mx-auto mb-2 text-gray-300" aria-hidden="true" />
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="font-medium text-gray-800">
                            {review.user_detail?.full_name || review.user_detail?.username}
                          </span>
                          <div className="mt-0.5">
                            <StarRating value={review.rating} readOnly size="sm" />
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(review.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600">{review.comment}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Map */}
            {shop.latitude && shop.longitude && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-800">Location</h3>
                </div>
                <MapView
                  shops={[{ ...shop, distance: null }]}
                  height="250px"
                  center={[parseFloat(shop.latitude), parseFloat(shop.longitude)]}
                  zoom={15}
                />
              </div>
            )}

            {/* Opening hours */}
            {shop.opening_hours && Object.keys(shop.opening_hours).length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" aria-hidden="true" /> Opening Hours
                </h3>
                <div className="space-y-1">
                  {Object.entries(shop.opening_hours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <span className="text-gray-600 capitalize">{day}</span>
                      <span className="text-gray-800 font-medium">{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetailPage;
