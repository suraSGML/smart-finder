/**
 * Full-screen map page with shop filters and nearby search.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { Filter, MapPin, Loader, Search } from 'lucide-react';
import MapView from '../components/MapView';
import ShopCard from '../components/ShopCard';
import { shopsAPI } from '../api/client';
import toast from 'react-hot-toast';

const CITIES = ['Addis Ababa', 'Dire Dawa', 'Mekelle', 'Gondar', 'Hawassa', 'Bahir Dar', 'Adama'];

const MapPage = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedShop, setSelectedShop] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [filters, setFilters] = useState({ city: 'Addis Ababa', radius: 10 });
  const [showFilters, setShowFilters] = useState(false);
  const [searchMode, setSearchMode] = useState('city'); // 'city' | 'nearby'

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (searchMode === 'nearby' && userLocation) {
        res = await shopsAPI.nearby({
          lat: userLocation.lat,
          lon: userLocation.lon,
          radius: filters.radius,
        });
        setShops(res.data.results || []);
      } else {
        res = await shopsAPI.list({ city: filters.city });
        setShops(res.data.results || res.data);
      }
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, [searchMode, userLocation, filters]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setSearchMode('nearby');
        },
        () => toast.error('Could not get your location. Please enable location access.')
      );
    }
  };

  const mapCenter = userLocation
    ? [userLocation.lat, userLocation.lon]
    : [9.0192, 38.7525]; // Addis Ababa

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-blue-600" aria-hidden="true" />
            Shop Map
          </h1>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            aria-expanded={showFilters}
          >
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filters
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Mode</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSearchMode('city')}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    searchMode === 'city' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  By City
                </button>
                <button
                  onClick={handleGetLocation}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    searchMode === 'nearby' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  Near Me
                </button>
              </div>
            </div>

            {searchMode === 'city' && (
              <div>
                <label htmlFor="city-select" className="block text-sm font-medium text-gray-700 mb-1">City</label>
                <select
                  id="city-select"
                  value={filters.city}
                  onChange={(e) => setFilters((f) => ({ ...f, city: e.target.value }))}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            {searchMode === 'nearby' && (
              <div>
                <label htmlFor="radius-select" className="block text-sm font-medium text-gray-700 mb-1">
                  Radius: {filters.radius} km
                </label>
                <input
                  id="radius-select"
                  type="range"
                  min={1}
                  max={50}
                  value={filters.radius}
                  onChange={(e) => setFilters((f) => ({ ...f, radius: parseInt(e.target.value) }))}
                  className="w-32"
                />
              </div>
            )}

            <button
              onClick={fetchShops}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
              Apply
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map */}
          <div className="lg:col-span-2">
            {loading ? (
              <div className="h-[500px] bg-gray-100 rounded-xl flex items-center justify-center">
                <Loader className="h-8 w-8 text-blue-600 animate-spin" aria-label="Loading map" />
              </div>
            ) : (
              <MapView
                shops={shops}
                selectedShop={selectedShop}
                onShopClick={setSelectedShop}
                height="500px"
                center={mapCenter}
                userLocation={userLocation}
              />
            )}
            <p className="text-xs text-gray-400 mt-2 text-center">
              {shops.length} shop{shops.length !== 1 ? 's' : ''} shown on map
            </p>
          </div>

          {/* Shop list sidebar */}
          <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl h-32 animate-pulse" />
              ))
            ) : shops.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-white rounded-xl">
                <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-300" aria-hidden="true" />
                <p>No shops found in this area.</p>
              </div>
            ) : (
              shops.map((shop) => (
                <div
                  key={shop.id}
                  className={`cursor-pointer transition-all ${
                    selectedShop?.id === shop.id ? 'ring-2 ring-blue-500 rounded-xl' : ''
                  }`}
                  onClick={() => setSelectedShop(shop)}
                >
                  <ShopCard shop={shop} />
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
