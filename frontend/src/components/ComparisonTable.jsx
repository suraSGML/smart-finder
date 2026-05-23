/**
 * Comparison table showing shops ranked by price, distance, and availability.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Star, CheckCircle, XCircle, Award, TrendingDown, Navigation } from 'lucide-react';

const LABEL_CONFIG = {
  best_choice: { icon: Award, color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', label: 'Best Choice' },
  cheapest: { icon: TrendingDown, color: 'text-green-600', bg: 'bg-green-50 border-green-200', label: 'Cheapest' },
  nearest: { icon: Navigation, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', label: 'Nearest' },
};

const ScoreBar = ({ score, color = 'bg-blue-500' }) => (
  <div className="flex items-center gap-2">
    <div className="flex-1 bg-gray-200 rounded-full h-1.5">
      <div
        className={`h-1.5 rounded-full ${color}`}
        style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
    <span className="text-xs text-gray-500 w-8 text-right">{score?.toFixed(0)}</span>
  </div>
);

const ComparisonTable = ({ comparison, productName }) => {
  if (!comparison || !comparison.ranked || comparison.ranked.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No shops found carrying this product.</p>
      </div>
    );
  }

  const { ranked, summary } = comparison;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="bg-blue-50 rounded-xl p-4 flex flex-wrap gap-4 text-sm">
        <span className="text-gray-600">
          <strong className="text-blue-700">{summary.total_shops}</strong> shops found
        </span>
        <span className="text-gray-600">
          Price range: <strong className="text-green-700">ETB {Number(summary.min_price).toLocaleString()}</strong>
          {' – '}
          <strong className="text-red-600">ETB {Number(summary.max_price).toLocaleString()}</strong>
        </span>
        {summary.price_range > 0 && (
          <span className="text-gray-600">
            Save up to <strong className="text-green-700">ETB {Number(summary.price_range).toLocaleString()}</strong>
          </span>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Rank</th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">Shop</th>
              <th className="text-right px-4 py-3 font-semibold text-gray-600">Price (ETB)</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Distance</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Stock</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Rating</th>
              <th className="text-center px-4 py-3 font-semibold text-gray-600">Score</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ranked.map((item) => {
              const labelConfig = item.label ? LABEL_CONFIG[item.label] : null;
              const LabelIcon = labelConfig?.icon;
              return (
                <tr
                  key={item.shop_product_id}
                  className={`transition-colors ${labelConfig ? labelConfig.bg + ' border-l-4' : 'hover:bg-gray-50'}`}
                >
                  <td className="px-4 py-3 font-bold text-gray-500">#{item.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {item.shop_logo ? (
                        <img src={item.shop_logo} alt="" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                          {item.shop_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <Link to={`/shops/${item.shop_id}`} className="font-medium text-gray-800 hover:text-blue-600">
                          {item.shop_name}
                        </Link>
                        <p className="text-xs text-gray-500">{item.shop_city}</p>
                      </div>
                      {labelConfig && (
                        <span className={`flex items-center gap-1 text-xs font-semibold ${labelConfig.color} ml-2`}>
                          <LabelIcon className="h-3.5 w-3.5" aria-hidden="true" />
                          {labelConfig.label}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800">
                    {Number(item.price).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-600">
                    {item.distance_km != null ? (
                      <span className="flex items-center justify-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                        {item.distance_km < 1
                          ? `${(item.distance_km * 1000).toFixed(0)}m`
                          : `${item.distance_km.toFixed(1)} km`}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {item.availability ? (
                      <span className="flex items-center justify-center gap-1 text-green-600">
                        <CheckCircle className="h-4 w-4" aria-hidden="true" />
                        {item.stock_quantity != null ? item.stock_quantity : 'In Stock'}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-1 text-red-500">
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Out of Stock
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="flex items-center justify-center gap-1">
                      <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" aria-hidden="true" />
                      {item.shop_rating.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBar score={item.final_score} color="bg-blue-500" />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/shops/${item.shop_id}`}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium whitespace-nowrap"
                    >
                      Visit →
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {ranked.map((item) => {
          const labelConfig = item.label ? LABEL_CONFIG[item.label] : null;
          const LabelIcon = labelConfig?.icon;
          return (
            <div
              key={item.shop_product_id}
              className={`rounded-xl border p-4 ${labelConfig ? labelConfig.bg + ' ' + labelConfig.bg.replace('bg-', 'border-') : 'bg-white border-gray-200'}`}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <Link to={`/shops/${item.shop_id}`} className="font-semibold text-gray-800 hover:text-blue-600">
                    #{item.rank} {item.shop_name}
                  </Link>
                  <p className="text-xs text-gray-500">{item.shop_city}</p>
                </div>
                {labelConfig && (
                  <span className={`flex items-center gap-1 text-xs font-bold ${labelConfig.color}`}>
                    <LabelIcon className="h-3.5 w-3.5" aria-hidden="true" />
                    {labelConfig.label}
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Price</span>
                  <p className="font-bold text-gray-800">ETB {Number(item.price).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-gray-500">Distance</span>
                  <p className="font-medium">
                    {item.distance_km != null
                      ? item.distance_km < 1
                        ? `${(item.distance_km * 1000).toFixed(0)}m`
                        : `${item.distance_km.toFixed(1)} km`
                      : '—'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Stock</span>
                  <p className={item.availability ? 'text-green-600 font-medium' : 'text-red-500'}>
                    {item.availability ? 'In Stock' : 'Out of Stock'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Score</span>
                  <p className="font-bold text-blue-600">{item.final_score.toFixed(1)}/100</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComparisonTable;
