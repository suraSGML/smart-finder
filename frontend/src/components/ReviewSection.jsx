import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, Send, User, Trash2, Edit2, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError } from './Toast';
import { reviewsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const ReviewSection = ({ productId, shopId, reviews: initialReviews = [] }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  // Load reviews from API
  useEffect(() => {
    const loadReviews = async () => {
      try {
        setIsLoading(true);
        if (shopId) {
          const res = await reviewsAPI.shopReviews(shopId);
          setReviews(res.data.results || res.data);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (shopId) {
      loadReviews();
    }
  }, [shopId]);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      showError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      showError('Please write a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        shop: shopId,
        rating,
        comment: comment.trim(),
      };

      if (editingId) {
        // Update existing review
        await reviewsAPI.update(editingId, reviewData);
        showSuccess('Review updated successfully!');
        setReviews((prev) =>
          prev.map((r) =>
            r.id === editingId
              ? { ...r, rating, comment: comment.trim() }
              : r
          )
        );
        setEditingId(null);
      } else {
        // Create new review
        const res = await reviewsAPI.create(reviewData);
        showSuccess('Review submitted successfully!');
        setReviews((prev) => [res.data, ...prev]);
      }

      setRating(0);
      setComment('');
      setEditRating(0);
      setEditComment('');
    } catch (err) {
      showError(err?.response?.data?.detail || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;

    try {
      await reviewsAPI.delete(reviewId);
      showSuccess('Review deleted successfully!');
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    } catch (err) {
      showError('Failed to delete review');
    }
  };

  const handleEditReview = (review) => {
    setEditingId(review.id);
    setRating(review.rating);
    setComment(review.comment);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setRating(0);
    setComment('');
    setEditRating(0);
    setEditComment('');
  };

  const averageRating =
    reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage:
      reviews.length > 0
        ? ((reviews.filter((r) => r.rating === star).length / reviews.length) * 100).toFixed(0)
        : 0,
  }));

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t('product.reviews') || 'Reviews'}
      </h2>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader className="h-6 w-6 text-blue-600 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Rating Summary */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                {averageRating}
              </div>
              <div className="flex justify-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={20}
                    className={
                      i < Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }
                  />
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Based on {reviews.length} reviews
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="md:col-span-2 space-y-2">
              {ratingDistribution.map(({ star, count, percentage }) => (
                <div key={star} className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                    {star} ★
                  </span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.5 }}
                      className="bg-yellow-400 h-2 rounded-full"
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Write Review Form */}
          {user && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
                {editingId ? 'Edit Your Review' : t('product.writeReview') || 'Write a Review'}
              </h3>

              {/* Star Rating Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none"
                    >
                      <Star
                        size={32}
                        className={
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }
                      />
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Your Review
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience with this product..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  <Send size={18} />
                  {isSubmitting ? 'Submitting...' : editingId ? 'Update Review' : 'Submit Review'}
                </motion.button>
                {editingId && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCancelEdit}
                    className="px-6 py-2 bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500 text-gray-800 dark:text-gray-100 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </motion.button>
                )}
              </div>
            </div>
          )}

          {/* Reviews List */}
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">
                {t('product.noReviews') || 'No reviews yet'}
              </p>
            ) : (
              reviews.map((review, index) => (
                <motion.div
                  key={review.id || index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white flex-shrink-0">
                      <User size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-gray-100">
                            {review.user?.name || review.author || 'Anonymous'}
                          </p>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < review.rating
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }
                              />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                            {review.created_at
                              ? new Date(review.created_at).toLocaleDateString()
                              : 'Recently'}
                          </span>
                          {user && user.id === review.user?.id && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleEditReview(review)}
                                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                              >
                                <Edit2 size={16} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDeleteReview(review.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                              >
                                <Trash2 size={16} />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                </motion.div>
              ))
            )}
          </div>
        </>
      )}
    </motion.section>
  );
};

export default ReviewSection;
