import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../context/FavoritesContext';
import ProductCard from './ProductCard';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react';

const RecentlyViewed = () => {
  const { recentlyViewed } = useFavorites();
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!recentlyViewed || recentlyViewed.length === 0) return null;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.section
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="mb-12"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Clock className="h-6 w-6 text-blue-600" aria-hidden="true" />
          Recently Viewed
        </h2>
        <button
          onClick={() => navigate('/search')}
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          View all
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recentlyViewed.slice(0, 8).map((product) => (
          <motion.div key={product.id} variants={itemVariants}>
            <ProductCard product={product} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};

export default RecentlyViewed;
