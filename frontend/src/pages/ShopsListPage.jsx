/**
 * Shops listing page with filters and search.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Star, Phone, Clock } from 'lucide-react';
import { shopsAPI } from '../api/client';
import SkeletonLoader from '../components/SkeletonLoader';
import EmptyState from '../components/EmptyState';
import SearchFilters from '../components/SearchFilters';
import { showError } from '../components/Toast';

const ShopsListPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 12;
  const [filters, setFilters] = useState({
    category: '',
    priceMin: 0,
    priceMax: 100000,
    rating: 0,
    distance: 10,
  });

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
        is_approved: true,
        is_active: true,
      };
      const response = await shopsAPI.list(params);
      setShops(response.data.results || []);
      setTotalCount(response.data.count || 0);
    } catch (error) {
      showError('Failed to load shops');
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [page, PAGE_SIZE]);

  useEffect(() => {
    setPage(1);
  }, [searchParams, filters]);

  useEffect(() => {
    fetchShops();
  }, [page, searchParams, filters, fetchShops]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            All Shops
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Browse and compare prices across {totalCount} shops
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Filters Sidebar */}
          <SearchFilters
            isOpen={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            onFilterChange={setFilters}
          />

          {/* Main Content */}
          <div className="flex-1">
            {/* Filter Toggle Button (Mobile) */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="md:hidden mb-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Filters
            </button>

            {/* Shops Grid */}
            {loading ? (
              <SkeletonLoader type="shop" count={6} />
            ) : shops.length === 0 ? (
              <EmptyState
                type="shops"
                action={{
                  label: 'Go Home',
                  onClick: () => navigate('/'),
                }}
              />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {shops.map((shop) => (
                  <motion.div
                    key={shop.id}
                    variants={itemVariants}
                    whileHover={{ y: -4 }}
                    onClick={() => navigate(`/shops/${shop.id}`)}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                  >
                    {/* Shop Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-24 relative">
                      <div className="absolute inset-0 opacity-10 bg-pattern" />
                    </div>

                    {/* Shop Info */}
                    <div className="p-6 -mt-12 relative">
                      {/* Shop Avatar */}
                      <div className="w-20 h-20 bg-blue-600 rounded-lg shadow-md mb-4 flex items-center justify-center">
                        <MapPin className="text-white" size={32} />
                      </div>

                      {/* Shop Name */}
                      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
                        {shop.name}
                      </h3>

                      {/* Rating */}
                      {shop.rating && (
                        <div className="flex items-center gap-1 mb-3">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                size={14}
                                className={
                                  i < Math.round(shop.rating)
                                    ? 'fill-yellow-400 text-yellow-400'
                                    : 'text-gray-300 dark:text-gray-600'
                                }
                              />
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            ({shop.review_count || 0})
                          </span>
                        </div>
                      )}

                      {/* Address */}
                      <div className="flex items-start gap-2 mb-3">
                        <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {shop.address}
                        </p>
                      </div>

                      {/* Phone */}
                      {shop.phone && (
                        <div className="flex items-center gap-2 mb-3">
                          <Phone size={16} className="text-gray-400" />
                          <a
                            href={`tel:${shop.phone}`}
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {shop.phone}
                          </a>
                        </div>
                      )}

                      {/* Hours */}
                      {shop.opening_hours && (
                        <div className="flex items-center gap-2 mb-4">
                          <Clock size={16} className="text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Open now
                          </p>
                        </div>
                      )}

                      {/* Action Button */}
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">
                        View Shop
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push('...');
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === '...' ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-gray-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          page === p
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopsListPage;
