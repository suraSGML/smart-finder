import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ThumbsUp, ThumbsDown, MessageSquare, Send, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { reviewsAPI } from '../api/client';
import { showSuccess, showError } from './Toast';

const ProductReviews = ({ productId }) => {
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  const [newReview, setNewReview] = useState({
    rating: 5,
    title: '',
    comment: '',
  });

  useEffect(() => {
    fetchReviews();
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await reviewsAPI.list({ product: productId });
      setReviews(response.data.results || response.data);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      showError('Please log in to submit a review');
      return;
    }

    setSubmitting(true);
    try {
      await reviewsAPI.create({
        product: productId,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
      });
      showSuccess('Review submitted successfully!');
      setNewReview({ rating: 5, title: '', comment: '' });
      setShowForm(false);
      fetchReviews();
    } catch (error) {
      showError('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (reviewId, voteType) => {
    if (!isAuthenticated) {
      showError('Please log in to vote');
      return;
    }

    try {
      await reviewsAPI.vote(reviewId, { vote_type: voteType });
      showSuccess('Vote recorded!');
      fetchReviews();
    } catch (error) {
      showError('Failed to vote');
    }
  };

  const renderStars = (rating, interactive = false, onRatingChange) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type={interactive ? 'button' : undefined}
            onClick={interactive ? () => onRatingChange(star) : undefined}
            disabled={!interactive}
            className={`${
              interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''
            }`}
          >
            <Star
              size={interactive ? 24 : 16}
              className={
                star <= rating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }
            />
          </button>
        ))}
      </div>
    );
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percentage: reviews.length > 0
      ? (reviews.filter((r) => r.rating === star).length / reviews.length) * 100
      : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Customer Reviews
        </h2>
        
        <div className="flex gap-8 items-start">
          {/* Average Rating */}
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-800 dark:text-gray-100">
              {averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center my-2">
              {renderStars(Math.round(averageRating))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {reviews.length} review{reviews.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Rating Distribution */}
          <div className="flex-1 space-y-2">
            {ratingDistribution.map(({ star, count, percentage }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                  {star}★
                </span>
                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    className="h-full bg-yellow-400 rounded-full"
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Write Review Button */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
          >
            <MessageSquare size={18} />
            {showForm ? 'Cancel' : 'Write a Review'}
          </button>
        </div>
      </div>

      {/* Review Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Write Your Review
            </h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rating
                </label>
                {renderStars(newReview.rating, true, (rating) =>
                  setNewReview({ ...newReview, rating })
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={newReview.title}
                  onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                  placeholder="Summarize your experience"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Review
                </label>
                <textarea
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 resize-none"
                  placeholder="Tell others about your experience with this product"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                >
                  {submitting ? (
                    <Loader size={18} className="animate-spin" />
                  ) : (
                    <Send size={18} />
                  )}
                  Submit Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader size={32} className="text-blue-600 animate-spin" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MessageSquare size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p>No reviews yet. Be the first to review this product!</p>
          </div>
        ) : (
          reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                      {review.title}
                    </h4>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    By {review.user?.username || 'Anonymous'} • {new Date(review.created_at).toLocaleDateString()}
                  </p>
                </div>
                {review.is_verified_purchase && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Verified Purchase
                  </span>
                )}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">{review.comment}</p>
              
              {/* Voting */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleVote(review.id, 'up')}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    review.user_vote === 'up'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400'
                  }`}
                >
                  <ThumbsUp size={16} />
                  {review.helpful_count || 0}
                </button>
                <button
                  onClick={() => handleVote(review.id, 'down')}
                  className={`flex items-center gap-1 text-sm transition-colors ${
                    review.user_vote === 'down'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400'
                  }`}
                >
                  <ThumbsDown size={16} />
                  {review.not_helpful_count || 0}
                </button>
                <span className="text-xs text-gray-400">
                  Was this helpful?
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;
