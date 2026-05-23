/**
 * Product display card showing name, category, price range, and shop count.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Tag, Store, TrendingUp, Heart } from 'lucide-react';
import { useFavorites } from '../context/FavoritesContext';
import { showSuccess, showError } from './Toast';

const CATEGORY_COLORS = {
  ELECTRONICS: 'bg-blue-100 text-blue-700',
  FOOD: 'bg-green-100 text-green-700',
  CLOTHING: 'bg-pink-100 text-pink-700',
  HOUSEHOLD: 'bg-yellow-100 text-yellow-700',
  HEALTH: 'bg-red-100 text-red-700',
  AUTOMOTIVE: 'bg-gray-100 text-gray-700',
  SPORTS: 'bg-orange-100 text-orange-700',
  BOOKS: 'bg-purple-100 text-purple-700',
  AGRICULTURE: 'bg-lime-100 text-lime-700',
  OTHER: 'bg-gray-100 text-gray-600',
};

const ProductCard = ({ product, showCompare = true }) => {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  const {
    id,
    name,
    category,
    category_display,
    image,
    brand,
    unit,
    min_price,
    max_price,
    shop_count,
  } = product;

  const categoryColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.OTHER;
  const favorite = isFavorite(id);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (favorite) {
        await removeFavorite(id);
        showSuccess('Removed from favorites');
      } else {
        await addFavorite(product);
        showSuccess('Added to favorites');
      }
    } catch (error) {
      showError('Failed to update favorites');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden group">
      {/* Product image */}
      <div className="relative h-48 bg-gray-100 overflow-hidden">
        {image ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Tag className="h-16 w-16 text-gray-300" aria-hidden="true" />
          </div>
        )}
        <span className={`absolute top-2 left-2 text-xs font-semibold px-2 py-1 rounded-full ${categoryColor}`}>
          {category_display || category}
        </span>
        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
          aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
          title={favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={18}
            className={favorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}
          />
        </button>
      </div>

      {/* Product info */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-800 text-base leading-tight mb-1 line-clamp-2">
          {name}
        </h3>

        {brand && (
          <p className="text-xs text-gray-500 mb-2">{brand}</p>
        )}

        {/* Price range */}
        <div className="mb-3">
          {min_price && min_price !== 'N/A' ? (
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-blue-700">
                ETB {typeof min_price === 'string' ? min_price : Number(min_price).toLocaleString()}
              </span>
              {max_price && max_price !== min_price && max_price !== 'N/A' && (
                <span className="text-sm text-gray-500">
                  – {typeof max_price === 'string' ? max_price : Number(max_price).toLocaleString()}
                </span>
              )}
              {unit && <span className="text-xs text-gray-400">/ {unit}</span>}
            </div>
          ) : (
            <span className="text-sm text-gray-400 italic">Price not available</span>
          )}
        </div>

        {/* Shop count */}
        <div className="flex items-center gap-1 text-sm text-gray-500 mb-4">
          <Store className="h-4 w-4" aria-hidden="true" />
          <span>{shop_count || 0} shop{shop_count !== 1 ? 's' : ''} available</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            to={`/products/${id}`}
            className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-lg transition-colors"
          >
            View Details
          </Link>
          {showCompare && shop_count > 0 && (
            <Link
              to={`/search?compare=${id}`}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
              title="Compare prices"
            >
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
