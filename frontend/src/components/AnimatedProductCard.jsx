import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Star, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AnimatedProductCard = ({ product, shops = [] }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { t } = useTranslation();

  const minPrice = shops.length > 0 ? Math.min(...shops.map((s) => s.price)) : 0;
  const maxPrice = shops.length > 0 ? Math.max(...shops.map((s) => s.price)) : 0;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3 },
    },
    hover: {
      y: -8,
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    },
  };

  const imageVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      whileHover="hover"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all"
    >
      {/* Image Container */}
      <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <motion.img
          variants={imageVariants}
          initial="initial"
          whileHover="hover"
          src={product.image || 'https://via.placeholder.com/300x200?text=Product'}
          alt={product.name}
          className="w-full h-full object-cover"
        />

        {/* Favorite Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsFavorite(!isFavorite)}
          className="absolute top-3 right-3 bg-white dark:bg-gray-800 rounded-full p-2 shadow-md hover:shadow-lg transition-shadow"
        >
          <Heart
            size={20}
            className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}
          />
        </motion.button>

        {/* Badge */}
        {shops.length > 0 && (
          <div className="absolute top-3 left-3 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            {shops.length} {t('common.shops')}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Category */}
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-1">
          {product.category}
        </p>

        {/* Product Name */}
        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-2 line-clamp-2">
          {product.name}
        </h3>

        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
            {product.brand}
          </p>
        )}

        {/* Price Range */}
        <div className="mb-3">
          {minPrice > 0 ? (
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {minPrice === maxPrice
                ? `${minPrice.toLocaleString()} ETB`
                : `${minPrice.toLocaleString()} - ${maxPrice.toLocaleString()} ETB`}
            </p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400 text-sm">Price not available</p>
          )}
        </div>

        {/* Rating */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-3">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={14}
                  className={
                    i < Math.round(product.rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }
                />
              ))}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-400">
              ({product.review_count || 0})
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm transition-colors text-center"
          >
            {t('product.viewDetails')}
          </Link>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 p-2 rounded-lg transition-colors"
            title="Add to cart"
          >
            <ShoppingCart size={18} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimatedProductCard;
