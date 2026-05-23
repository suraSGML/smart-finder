import React from 'react';
import { motion } from 'framer-motion';
import { Search, ShoppingBag, MapPin, Heart } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ type = 'search', message, action }) => {
  const { t } = useTranslation();

  const emptyStates = {
    search: {
      icon: Search,
      title: t('search.noResults'),
      message: t('search.tryDifferentSearch'),
      color: 'text-blue-500',
    },
    products: {
      icon: ShoppingBag,
      title: t('common.noResults'),
      message: t('product.noReviews'),
      color: 'text-purple-500',
    },
    shops: {
      icon: MapPin,
      title: t('home.noShops'),
      message: t('shop.noProducts'),
      color: 'text-green-500',
    },
    favorites: {
      icon: Heart,
      title: 'No Favorites Yet',
      message: 'Start adding your favorite products and shops',
      color: 'text-red-500',
    },
  };

  const state = emptyStates[type] || emptyStates.search;
  const Icon = state.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-16 px-4"
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className={`${state.color} mb-4`}
      >
        <Icon size={64} />
      </motion.div>

      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        {message || state.title}
      </h3>

      <p className="text-gray-600 dark:text-gray-400 text-center mb-6 max-w-md">
        {state.message}
      </p>

      {action && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={action.onClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
};

export default EmptyState;
