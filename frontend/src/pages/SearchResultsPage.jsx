/**
 * Search results page with comparison table and map toggle.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MapIcon, List, Filter, Loader, AlertCircle, ShoppingBag } from 'lucide-react';
import SearchBar from '../components/SearchBar';
import ProductCard from '../components/ProductCard';
import ShopCard from '../components/ShopCard';
import ComparisonTable from '../components/ComparisonTable';
import MapView from '../components/MapView';
import SearchFilters from '../components/SearchFilters';
import SkeletonLoader from '../components/SkeletonLoader';
import { searchAPI, comparisonAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { showError } from '../components/Toast';

const CATEGORIES = [
  { key: '', label: 'All' },
  { key: 'ELECTRONICS', label: 'Electronics' },
  { key: 'FOOD', label: 'Food' },
  { key: 'CLOTHING', label: 'Clothing' },
  { key: 'HOUSEHOLD', label: 'Household' },
  { key: 'HEALTH', label: 'Health' },
  { key: 'SPORTS', label: 'Sports' },
  { key: 'AGRICULTURE', label: 'Agriculture' },
  { key: 'OTHER', label: 'Other' },
];

const SearchResultsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || '';
  const compareProductId = searchParams.get('compare');

  const [results, setResults] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [activeTab, setActiveTab] = useState('products');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [selectedShop, setSelectedShop] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;
  const [filters, setFilters] = useState({
    category: categoryParam || '',
    priceMin: 0,
    priceMax: 100000,
    rating: 0,
    distance: 10,
    sortBy: 'relevance',
  });

  const userLat = user?.latitude || null;
  const userLon = user?.longitude || null;

  const doSearch = useCallback(async (q, appliedFilters) => {
    if (!q && !appliedFilters.category) return;
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (q) params.q = q;
      if (appliedFilters.category) params.category = appliedFilters.category;
      if (appliedFilters.priceMin > 0) params.price_min = appliedFilters.priceMin;
      if (appliedFilters.priceMax < 100000) params.price_max = appliedFilters.priceMax;
      if (appliedFilters.rating > 0) params.min_rating = appliedFilters.rating;
      if (appliedFilters.distance < 50) params.distance = appliedFilters.distance;
      if (appliedFilters.sortBy) params.sort_by = appliedFilters.sortBy;
      if (userLat) params.lat = userLat;
      if (userLon) params.lon = userLon;

      // If only category is set with no query, use a wildcard-style broad search
      // by fetching products by category directly instead of the search endpoint
      if (!q && appliedFilters.category) {
        const { productsAPI } = await import('../api/client');
        const res = await productsAPI.byCategory(appliedFilters.category);
        setResults({
          query: '',
          products: res.data.results || res.data,
          shops: [],
          shop_products: [],
          total_results: (res.data.results || res.data).length,
        });
        return;
      }

      const res = await searchAPI.search(params);
      setResults(res.data);
    } catch (err) {
      console.error('Search error:', err?.response?.status, err?.response?.data, err?.message);
      const msg =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        (err?.message === 'Network Error'
          ? 'Cannot connect to server. Is the backend running on port 8000?'
          : null) ||
        `Search failed (${err?.response?.status || err?.message})`;
      setError(msg);
      showError(msg);
    } finally {
      setLoading(false);
    }
  }, [userLat, userLon]);

  const doCompare = useCallback(async (productId) => {
    try {
      const params = {};
      if (userLat) params.lat = userLat;
      if (userLon) params.lon = userLon;
      const res = await comparisonAPI.compareProduct(productId, params);
      setComparison(res.data);
    } catch {
      setComparison(null);
    }
  }, [userLat, userLon]);

  useEffect(() => {
    if (query || categoryParam) {
      doSearch(query, filters);
    }
    if (compareProductId) {
      doCompare(compareProductId);
    }
  }, [query, categoryParam, filters, compareProductId, doSearch, doCompare]);

  const handleSearch = (newQuery) => {
    setPage(1);
    setSearchParams({ q: newQuery, ...(selectedCategory && { category: selectedCategory }) });
  };

  const handleCategoryChange = (cat) => {
    setPage(1);
    setSelectedCategory(cat);
    setFilters((prev) => ({ ...prev, category: cat }));
    setSearchParams({ q: query, ...(cat && { category: cat }) });
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // Update URL params with new filters
    const params = { q: query };
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.priceMin > 0) params.price_min = newFilters.priceMin;
    if (newFilters.priceMax < 100000) params.price_max = newFilters.priceMax;
    if (newFilters.rating > 0) params.min_rating = newFilters.rating;
    if (newFilters.distance < 50) params.distance = newFilters.distance;
    if (newFilters.sortBy && newFilters.sortBy !== 'relevance') params.sort_by = newFilters.sortBy;
    setSearchParams(params);
  };

  const allShops = results?.shop_products
    ? [...new Map(results.shop_products.map((sp) => [sp.shop_id, {
        id: sp.shop_id,
        name: sp.shop_name,
        city: sp.shop_city,
        rating: sp.shop_rating,
        latitude: sp.latitude,
        longitude: sp.longitude,
        distance: sp.distance_km,
      }])).values()]
    : (results?.shops || []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4 px-4 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto">
          <SearchBar initialQuery={query} onSearch={handleSearch} className="max-w-2xl" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Filters and Results Layout */}
        <div className="flex gap-6">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <SearchFilters
              onFilterChange={handleFilterChange}
              isOpen={true}
              onClose={() => {}}
              initialFilters={filters}
            />
          </div>

          {/* Mobile Filter Button */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <Filter size={20} />
              Filters
            </button>
          </div>

          {/* Mobile Filters Modal */}
          <SearchFilters
            onFilterChange={handleFilterChange}
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            initialFilters={filters}
          />

          {/* Main Content */}
          <div className="flex-1 min-w-0">
        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => handleCategoryChange(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:border-blue-300'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            {query && (
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Results for "<span className="text-blue-600">{query}</span>"
              </h1>
            )}
            {results && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {results.total_results} result{results.total_results !== 1 ? 's' : ''} found
              </p>
            )}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
            >
              <List className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`p-2 rounded-lg transition-colors ${viewMode === 'map' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              aria-label="Map view"
              aria-pressed={viewMode === 'map'}
            >
              <MapIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex-1 min-w-0">
            <SkeletonLoader type="product" count={8} />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" aria-hidden="true" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Comparison table (when compare param is set) */}
        {comparison && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
              Price Comparison: {comparison.product?.name}
            </h2>
            <ComparisonTable comparison={comparison.comparison} productName={comparison.product?.name} />
          </div>
        )}

        {/* Map view */}
        {viewMode === 'map' && !loading && (
          <div className="mb-6">
            <MapView
              shops={allShops}
              selectedShop={selectedShop}
              onShopClick={setSelectedShop}
              height="450px"
              userLocation={userLat && userLon ? { lat: userLat, lon: userLon } : null}
            />
          </div>
        )}

        {/* List view */}
        {viewMode === 'list' && !loading && results && (
          <>
            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6">
              <button
                onClick={() => setActiveTab('products')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'products'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Products ({results.products?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('shops')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'shops'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                Shops ({results.shops?.length || 0})
              </button>
            </div>

            {activeTab === 'products' && (
              <>
                {results.products?.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {results.products.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE).map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                    {results.products.length > PAGE_SIZE && (
                      <div className="flex justify-center gap-2 mt-6">
                        <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1} className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">Previous</button>
                        <span className="px-4 py-2 text-sm text-gray-600">Page {page} of {Math.ceil(results.products.length/PAGE_SIZE)}</span>
                        <button onClick={() => setPage(p => Math.min(Math.ceil(results.products.length/PAGE_SIZE),p+1))} disabled={page>=Math.ceil(results.products.length/PAGE_SIZE)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm disabled:opacity-40 hover:bg-gray-50">Next</button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                    <p>No products found for "{query}"</p>
                  </div>
                )}
              </>
            )}

            {activeTab === 'shops' && (
              <>
                {results.shops?.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {results.shops.map((shop) => (
                      <ShopCard
                        key={shop.id}
                        shop={shop}
                        onViewMap={(s) => { setSelectedShop(s); setViewMode('map'); }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 text-gray-500 dark:text-gray-400">
                    <p>No shops found for "{query}"</p>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !error && !results && !query && (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <Filter className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" aria-hidden="true" />
            <p className="text-lg">Enter a search query to find products and shops</p>
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsPage;
