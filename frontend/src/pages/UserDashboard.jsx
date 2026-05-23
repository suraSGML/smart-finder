/**
 * User dashboard: personalized analytics, recent activity, and favorites.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, Eye, Store, Loader, TrendingUp, Clock, Package } from 'lucide-react';
import { analyticsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ label, value, color = 'text-blue-700', icon: Icon }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
    {Icon && <Icon className={`h-8 w-8 ${color} opacity-80`} aria-hidden="true" />}
    <div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </div>
);

const UserDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await analyticsAPI.userDashboard();
        setDashboardData(res.data);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-10 w-10 text-blue-600 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  const { user: userData, favorites_count, recent_searches, recent_views, saved_shops } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome back, {userData?.first_name || userData?.username}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's your activity overview</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard 
            label="Favorites" 
            value={favorites_count} 
            icon={Heart} 
            color="text-red-600" 
          />
          <StatCard 
            label="Recent Searches" 
            value={recent_searches?.length || 0} 
            icon={Search} 
            color="text-blue-600" 
          />
          <StatCard 
            label="Recent Views" 
            value={recent_views?.length || 0} 
            icon={Eye} 
            color="text-green-600" 
          />
          <StatCard 
            label="Saved Shops" 
            value={saved_shops?.length || 0} 
            icon={Store} 
            color="text-purple-600" 
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {[
            { key: 'overview', label: 'Overview', icon: TrendingUp },
            { key: 'activity', label: 'Recent Activity', icon: Clock },
            { key: 'saved', label: 'Saved Items', icon: Heart },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Recent searches */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" aria-hidden="true" />
                Recent Searches
              </h3>
              {recent_searches?.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent searches.</p>
              ) : (
                <div className="space-y-2">
                  {recent_searches?.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.query}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent views */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" aria-hidden="true" />
                Recent Views
              </h3>
              {recent_views?.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent views.</p>
              ) : (
                <div className="space-y-2">
                  {recent_views?.slice(0, 5).map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {item.type === 'product' ? (
                          <Package className="h-4 w-4 text-blue-500" aria-hidden="true" />
                        ) : (
                          <Store className="h-4 w-4 text-purple-500" aria-hidden="true" />
                        )}
                        <span className="text-sm text-gray-700">{item.name}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity tab */}
        {activeTab === 'activity' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* All recent searches */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">All Recent Searches</h3>
              {recent_searches?.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent searches.</p>
              ) : (
                <div className="space-y-3">
                  {recent_searches?.map((item, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-gray-700 font-medium">{item.query}</p>
                        <p className="text-xs text-gray-400">
                          {item.results_count} results
                          {item.category_filter && ` • ${item.category_filter}`}
                          {item.city_filter && ` • ${item.city_filter}`}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* All recent views */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">All Recent Views</h3>
              {recent_views?.length === 0 ? (
                <p className="text-gray-400 text-sm">No recent views.</p>
              ) : (
                <div className="space-y-3">
                  {recent_views?.map((item, i) => (
                    <div key={i} className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          {item.type === 'product' ? (
                            <Package className="h-4 w-4 text-blue-500" aria-hidden="true" />
                          ) : (
                            <Store className="h-4 w-4 text-purple-500" aria-hidden="true" />
                          )}
                          <p className="text-sm text-gray-700 font-medium">{item.name}</p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {item.type === 'product' 
                            ? `${item.category} • ${item.shop}` 
                            : `${item.city} • ${item.address}`
                          }
                        </p>
                      </div>
                      <span className="text-xs text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Saved items tab */}
        {activeTab === 'saved' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Saved shops (for shop owners) */}
            {saved_shops?.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Store className="h-4 w-4 text-purple-600" aria-hidden="true" />
                  Your Shops
                </h3>
                <div className="space-y-3">
                  {saved_shops?.map((shop) => (
                    <Link
                      key={shop.id}
                      to={`/shops/${shop.id}`}
                      className="block p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-800">{shop.name}</p>
                          <p className="text-xs text-gray-500">{shop.city}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-800">{shop.rating.toFixed(1)} ★</p>
                          <p className="text-xs text-gray-500">{shop.product_count} products</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Favorites placeholder */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-600" aria-hidden="true" />
                Favorites
              </h3>
              {favorites_count === 0 ? (
                <p className="text-gray-400 text-sm">No favorites yet.</p>
              ) : (
                <p className="text-gray-600 text-sm">
                  You have {favorites_count} favorite products. 
                  <Link to="/favorites" className="text-blue-600 hover:underline ml-1">
                    View all favorites →
                  </Link>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
