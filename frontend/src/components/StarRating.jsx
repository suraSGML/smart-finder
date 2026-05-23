/**
 * Interactive star rating component.
 * Supports read-only display and interactive selection.
 */
import React, { useState } from 'react';
import { Star } from 'lucide-react';

const StarRating = ({
  value = 0,
  onChange,
  readOnly = false,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const [hovered, setHovered] = useState(0);

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-7 w-7',
    xl: 'h-9 w-9',
  };

  const starSize = sizeClasses[size] || sizeClasses.md;

  const labels = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very Good',
    5: 'Excellent',
  };

  const displayValue = readOnly ? value : (hovered || value);

  const handleClick = (star) => {
    if (!readOnly && onChange) {
      onChange(star);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div
        className="flex items-center gap-0.5"
        role={readOnly ? 'img' : 'radiogroup'}
        aria-label={readOnly ? `Rating: ${value} out of 5` : 'Select rating'}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= displayValue;
          const halfFilled = !filled && star - 0.5 <= displayValue;

          return (
            <button
              key={star}
              type="button"
              role={readOnly ? undefined : 'radio'}
              aria-checked={readOnly ? undefined : value === star}
              aria-label={readOnly ? undefined : `${star} star${star !== 1 ? 's' : ''}`}
              disabled={readOnly}
              onClick={() => handleClick(star)}
              onMouseEnter={() => !readOnly && setHovered(star)}
              onMouseLeave={() => !readOnly && setHovered(0)}
              className={`transition-transform ${
                readOnly
                  ? 'cursor-default'
                  : 'cursor-pointer hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:ring-offset-1 rounded'
              }`}
            >
              <Star
                className={`${starSize} transition-colors ${
                  filled
                    ? 'text-yellow-400 fill-yellow-400'
                    : halfFilled
                    ? 'text-yellow-300 fill-yellow-200'
                    : 'text-gray-300'
                }`}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>

      {showLabel && displayValue > 0 && (
        <span className="text-sm text-gray-600 ml-1">
          {labels[Math.round(displayValue)] || ''}
        </span>
      )}

      {!readOnly && value > 0 && (
        <span className="text-sm text-gray-500 ml-1">
          {value}/5
        </span>
      )}
    </div>
  );
};

export default StarRating;
