import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const SearchFilters = ({ onFilterChange, isOpen, onClose, initialFilters = {} }) => {
  const { t } = useTranslation();
  const [filters, setFilters] = useState({
    category: initialFilters.category || '',
    priceMin: initialFilters.priceMin || 0,
    priceMax: initialFilters.priceMax || 100000,
    rating: initialFilters.rating || 0,
    distance: initialFilters.distance || 10,
    sortBy: initialFilters.sortBy || 'relevance',
  });

  const [expandedSections, setExpandedSections] = useState({
    category: true,
    price: true,
    rating: true,
    distance: true,
  });

  const categories = [
    'ELECTRONICS',
    'FOOD',
    'CLOTHING',
    'HOUSEHOLD',
    'HEALTH',
    'SPORTS',
  ];

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleReset = () => {
    const resetFilters = {
      category: '',
      priceMin: 0,
      priceMax: 100000,
      rating: 0,
      distance: 10,
      sortBy: 'relevance',
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  // Update filters when initialFilters change
  useEffect(() => {
    if (initialFilters && Object.keys(initialFilters).length > 0) {
      setFilters((prev) => ({
        ...prev,
        ...initialFilters,
      }));
    }
  }, [initialFilters]);

  const filterVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          />

          {/* Filters Panel */}
          <motion.div
            variants={filterVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed md:relative left-0 top-0 h-screen md:h-auto w-64 bg-white dark:bg-gray-800 shadow-lg z-50 md:z-0 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 md:hidden">
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                {t('search.filters')}
              </h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Category Filter */}
              <div>
                <button
                  onClick={() => toggleSection('category')}
                  className="w-full flex justify-between items-center py-2 font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {t('search.category')}
                  <motion.div
                    animate={{ rotate: expandedSections.category ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedSections.category && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 mt-2"
                    >
                      {categories.map((cat) => (
                        <label key={cat} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="category"
                            value={cat}
                            checked={filters.category === cat}
                            onChange={(e) => handleFilterChange('category', e.target.value)}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {cat}
                          </span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Price Range Filter */}
              <div>
                <button
                  onClick={() => toggleSection('price')}
                  className="w-full flex justify-between items-center py-2 font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {t('search.priceRange')}
                  <motion.div
                    animate={{ rotate: expandedSections.price ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedSections.price && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-3 mt-2"
                    >
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">
                          Min: {filters.priceMin.toLocaleString()} ETB
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100000"
                          step="1000"
                          value={filters.priceMin}
                          onChange={(e) =>
                            handleFilterChange('priceMin', parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">
                          Max: {filters.priceMax.toLocaleString()} ETB
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="100000"
                          step="1000"
                          value={filters.priceMax}
                          onChange={(e) =>
                            handleFilterChange('priceMax', parseInt(e.target.value))
                          }
                          className="w-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Rating Filter */}
              <div>
                <button
                  onClick={() => toggleSection('rating')}
                  className="w-full flex justify-between items-center py-2 font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {t('search.rating')}
                  <motion.div
                    animate={{ rotate: expandedSections.rating ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedSections.rating && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 mt-2"
                    >
                      {[4, 3, 2, 1].map((rating) => (
                        <label key={rating} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="rating"
                            value={rating}
                            checked={filters.rating === rating}
                            onChange={(e) => handleFilterChange('rating', parseInt(e.target.value))}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">
                            {rating}+ Stars
                          </span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Distance Filter */}
              <div>
                <button
                  onClick={() => toggleSection('distance')}
                  className="w-full flex justify-between items-center py-2 font-semibold text-gray-800 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400"
                >
                  {t('search.distance')}
                  <motion.div
                    animate={{ rotate: expandedSections.distance ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown size={20} />
                  </motion.div>
                </button>

                <AnimatePresence>
                  {expandedSections.distance && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 mt-2"
                    >
                      <div>
                        <label className="text-xs text-gray-600 dark:text-gray-400">
                          Within {filters.distance} km
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={filters.distance}
                          onChange={(e) => handleFilterChange('distance', parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">
                  {t('search.sortBy') || 'Sort By'}
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-sm"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="newest">Newest</option>
                  <option value="distance">Nearest</option>
                </select>
              </div>

              {/* Reset Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReset}
                className="w-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-2 rounded-lg font-medium transition-colors mt-4"
              >
                {t('search.resetFilters') || 'Reset Filters'}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchFilters;
