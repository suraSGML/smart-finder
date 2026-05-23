/**
 * Shop card displaying name, rating, distance, and available products.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, Phone, Package } from 'lucide-react';

const ShopCard = ({ shop, onViewMap }) => {
  const {
    id,
    name,
    logo,
    address,
    city,
    rating,
    review_count,
    distance,
    phone,
    product_count,
    is_approved,
  } = shop;

  const ratingNum = parseFloat(rating) || 0;

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <div className="flex items-start p-4 gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-blue-50 flex items-center justify-center">
          {logo ? (
            <img src={logo} alt={`${name} logo`} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-blue-600">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-800 text-base leading-tight truncate">
              {name}
            </h3>
            {!is_approved && (
              <span className="flex-shrink-0 text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                Pending
              </span>
            )}
          </div>

          {/* Location */}
          <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
            <span className="truncate">{address}, {city}</span>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3.5 w-3.5 ${
                    star <= Math.round(ratingNum)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-300'
                  }`}
                  aria-hidden="true"
                />
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{ratingNum.toFixed(1)}</span>
            <span className="text-xs text-gray-400">({review_count} reviews)</span>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
            {distance != null && (
              <span className="flex items-center gap-1 text-blue-600 font-medium">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)} km`}
              </span>
            )}
            {product_count != null && (
              <span className="flex items-center gap-1">
                <Package className="h-3 w-3" aria-hidden="true" />
                {product_count} products
              </span>
            )}
            {phone && (
              <a
                href={`tel:${phone}`}
                className="flex items-center gap-1 hover:text-blue-600"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3" aria-hidden="true" />
                {phone}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex gap-2">
        <Link
          to={`/shops/${id}`}
          className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          View Shop
        </Link>
        {onViewMap && (
          <button
            onClick={() => onViewMap(shop)}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 px-3 rounded-lg transition-colors"
            aria-label="View on map"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ShopCard;
