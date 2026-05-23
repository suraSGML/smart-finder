/**
 * Home page: hero section, search bar, categories, and trending products.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, TrendingUp, ShoppingBag, Store, ChevronRight, Clock } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import { searchAPI, shopsAPI } from '../api/client';

const CATEGORIES = [
  { key: 'ELECTRONICS', label: 'Electronics', emoji: '📱', color: 'bg-blue-100 text-blue-700' },
  { key: 'FOOD', label: 'Food & Groceries', emoji: '🛒', color: 'bg-green-100 text-green-700' },
  { key: 'CLOTHING', label: 'Clothing', emoji: '👗', color: 'bg-pink-100 text-pink-700' },
  { key: 'HOUSEHOLD', label: 'Household', emoji: '🏠', color: 'bg-yellow-100 text-yellow-700' },
  { key: 'HEALTH', label: 'Health & Beauty', emoji: '💊', color: 'bg-red-100 text-red-700' },
  { key: 'AUTOMOTIVE', label: 'Automotive', emoji: '🚗', color: 'bg-gray-100 text-gray-700' },
  { key: 'SPORTS', label: 'Sports', emoji: '⚽', color: 'bg-orange-100 text-orange-700' },
  { key: 'AGRICULTURE', label: 'Agriculture', emoji: '🌾', color: 'bg-lime-100 text-lime-700' },
];

const HomePage = () => {
  const navigate = useNavigate();
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [trendingSearches, setTrendingSearches] = useState([]);
  const [nearbyShops, setNearbyShops] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    // Fetch trending data
    searchAPI.trending()
      .then((res) => {
        setTrendingSearches(res.data.trending_searches || []);
        setTrendingProducts(res.data.trending_products || []);
      })
      .catch(() => {})
      .finally(() => setLoadingTrending(false));

    // Try to get user location for nearby shops
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
          shopsAPI.nearby({ lat: loc.lat, lon: loc.lon, radius: 5 })
            .then((res) => setNearbyShops(res.data.results?.slice(0, 4) || []))
            .catch(() => {});
        },
        () => {}
      );
    }

    // Load recently viewed products
    const viewed = localStorage.getItem('recentlyViewed');
    if (viewed) {
      try {
        setRecentlyViewed(JSON.parse(viewed).slice(0, 8));
      } catch (err) {
        console.error('Failed to parse recently viewed:', err);
      }
    }
  }, []);

  const handleSearch = (query) => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
  };

  const handleCategoryClick = (category) => {
    navigate(`/search?category=${category}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-blue-600 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <MapPin className="h-6 w-6 text-yellow-400" aria-hidden="true" />
            <span className="text-yellow-300 font-medium">Ethiopia's Smart Product Finder</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Find the Best Prices<br />
            <span className="text-yellow-400">Near You</span>
          </h1>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Compare prices across local shops in Addis Ababa and across Ethiopia.
            Save money, support local businesses.
          </p>

          <SearchBar onSearch={handleSearch} className="max-w-2xl mx-auto" />

          {/* Trending searches */}
          {trendingSearches.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className="text-blue-200 text-sm">Trending:</span>
              {trendingSearches.slice(0, 5).map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSearch(item.query)}
                  className="text-sm bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition-colors"
                >
                  {item.query}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap justify-center gap-8 text-center">
          {[
            { icon: Store, label: 'Local Shops', value: '500+' },
            { icon: ShoppingBag, label: 'Products', value: '10,000+' },
            { icon: TrendingUp, label: 'Price Comparisons', value: 'Daily' },
            { icon: MapPin, label: 'Cities', value: 'Ethiopia-wide' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <div className="text-left">
                <div className="font-bold text-gray-800">{value}</div>
                <div className="text-xs text-gray-500">{label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Browse Categories</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryClick(cat.key)}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl ${cat.color} hover:opacity-80 transition-opacity cursor-pointer`}
            >
              <span className="text-2xl" role="img" aria-label={cat.label}>{cat.emoji}</span>
              <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Recently Viewed Products */}
      {recentlyViewed.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
              <Clock className="h-6 w-6 text-blue-600" aria-hidden="true" />
              Recently Viewed
            </h2>
            <button
              onClick={() => navigate('/search')}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {recentlyViewed.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Trending Products */}
      {trendingProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" aria-hidden="true" />
              Trending Products
            </h2>
            <button
              onClick={() => navigate('/search?q=trending')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              View all <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          {loadingTrending ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-64 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {trendingProducts.slice(0, 8).map((item) => (
                <div
                  key={item.product_id}
                  className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => navigate(`/products/${item.product_id}`)}
                >
                  <div className="text-sm font-semibold text-gray-800 mb-1 line-clamp-2">
                    {item.product__name || item.product_name}
                  </div>
                  <div className="text-xs text-gray-500">{item.view_count} views</div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Nearby Shops */}
      {nearbyShops.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 pb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="h-6 w-6 text-blue-600" aria-hidden="true" />
              Shops Near You
            </h2>
            <button
              onClick={() => navigate('/map')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              View on map <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {nearbyShops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-xl shadow-md p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/shops/${shop.id}`)}
              >
                <div className="font-semibold text-gray-800 mb-1">{shop.name}</div>
                <div className="text-xs text-gray-500 mb-2">{shop.address}</div>
                {shop.distance != null && (
                  <div className="text-xs text-blue-600 font-medium">
                    📍 {shop.distance < 1 ? `${(shop.distance * 1000).toFixed(0)}m` : `${shop.distance.toFixed(1)} km`} away
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="bg-blue-700 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Own a Shop in Ethiopia?</h2>
          <p className="text-blue-100 mb-8">
            List your products and reach thousands of customers looking for the best prices near them.
          </p>
          <button
            onClick={() => navigate('/register')}
            className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 font-bold px-8 py-3 rounded-xl text-lg transition-colors"
          >
            Register Your Shop
          </button>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
