import React, { useState, useEffect, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import { Navigation, MapPin, Loader } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import L from 'leaflet';

// Fix default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_CENTER = [9.032, 38.7469]; // Addis Ababa

// Custom user location icon (blue dot)
const userIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="#2563eb" stroke="white" stroke-width="3"/>
      <circle cx="12" cy="12" r="3" fill="white"/>
    </svg>`),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
  popupAnchor: [0, -14],
});

// Custom shop icon (red pin)
const shopIcon = new L.Icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36">
      <path d="M14 0C6.268 0 0 6.268 0 14c0 9.333 14 22 14 22S28 23.333 28 14C28 6.268 21.732 0 14 0z" fill="#dc2626"/>
      <circle cx="14" cy="14" r="6" fill="white"/>
    </svg>`),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -38],
});

// Cluster icon for grouped shops
const clusterIcon = (count) =>
  new L.DivIcon({
    html: `<div style="
      background:#2563eb;color:white;border-radius:50%;
      width:36px;height:36px;display:flex;align-items:center;
      justify-content:center;font-weight:bold;font-size:13px;
      border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);">
      ${count}
    </div>`,
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });

// Haversine distance in km
const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Cluster shops that are within 0.5 km of each other
const clusterShops = (shops) => {
  const clusters = [];
  const assigned = new Set();

  shops.forEach((shop, i) => {
    if (assigned.has(i)) return;
    const cluster = [shop];
    assigned.add(i);

    shops.forEach((other, j) => {
      if (i === j || assigned.has(j)) return;
      const d = haversine(
        parseFloat(shop.latitude),
        parseFloat(shop.longitude),
        parseFloat(other.latitude),
        parseFloat(other.longitude)
      );
      if (d <= 0.5) {
        cluster.push(other);
        assigned.add(j);
      }
    });

    const lat = cluster.reduce((s, s2) => s + parseFloat(s2.latitude), 0) / cluster.length;
    const lng = cluster.reduce((s, s2) => s + parseFloat(s2.longitude), 0) / cluster.length;
    clusters.push({ shops: cluster, lat, lng });
  });

  return clusters;
};

// Sub-component: programmatically pan/zoom the map
const MapController = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14);
  }, [center, map]);
  return null;
};

const EnhancedMap = ({ shops = [], userLocation: propUserLocation = null, height = '400px' }) => {
  const { t } = useTranslation();

  const [userLocation, setUserLocation] = useState(propUserLocation || DEFAULT_CENTER);
  const [mapCenter, setMapCenter] = useState(null);
  const [distance, setDistance] = useState(10);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [hasRealLocation, setHasRealLocation] = useState(!!propUserLocation);

  useEffect(() => {
    if (propUserLocation) {
      setUserLocation(propUserLocation);
      setHasRealLocation(true);
    }
  }, [propUserLocation]);

  const getMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setUserLocation(coords);
        setMapCenter(coords);
        setHasRealLocation(true);
        setLocating(false);
      },
      (err) => {
        const messages = {
          1: 'Location access denied. Please allow location in your browser settings.',
          2: 'Location unavailable. Please try again.',
          3: 'Location request timed out. Please try again.',
        };
        setLocationError(messages[err.code] || 'Could not get your location.');
        setLocating(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const filteredShops = shops.filter((shop) => {
    const lat = parseFloat(shop.latitude);
    const lng = parseFloat(shop.longitude);
    if (isNaN(lat) || isNaN(lng)) return false;
    return haversine(userLocation[0], userLocation[1], lat, lng) <= distance;
  });

  const shopsWithDistance = filteredShops.map((shop) => ({
    ...shop,
    _distance: haversine(
      userLocation[0],
      userLocation[1],
      parseFloat(shop.latitude),
      parseFloat(shop.longitude)
    ),
  }));

  const clusters = clusterShops(shopsWithDistance);

  const openDirections = (lat, lng) => {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <MapPin size={20} className="text-blue-600" />
          {t('common.map', 'Shop Map')}
        </h2>

        <button
          onClick={getMyLocation}
          disabled={locating}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium rounded-lg transition-colors"
          aria-label="Get my location"
        >
          {locating ? (
            <Loader size={16} className="animate-spin" />
          ) : (
            <Navigation size={16} />
          )}
          {locating ? 'Locating…' : 'Near Me'}
        </button>
      </div>

      {locationError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
          {locationError}
        </div>
      )}

      {!hasRealLocation && !locationError && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg text-sm text-yellow-700 dark:text-yellow-300">
          Showing default location (Addis Ababa). Click "Near Me" to use your actual location.
        </div>
      )}

      {/* Distance slider */}
      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Radius: <span className="text-blue-600 dark:text-blue-400">{distance} km</span>
          </label>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-600 px-2 py-1 rounded-full">
            {filteredShops.length} shop{filteredShops.length !== 1 ? 's' : ''} found
          </span>
        </div>
        <input
          type="range"
          min="1"
          max="50"
          value={distance}
          onChange={(e) => setDistance(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-600"
          aria-label="Distance radius filter"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>1 km</span>
          <span>50 km</span>
        </div>
      </div>

      {/* Map */}
      <div
        className="rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-600"
        style={{ height }}
      >
        <MapContainer
          center={userLocation}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />

          {mapCenter && <MapController center={mapCenter} />}

          <Circle
            center={userLocation}
            radius={distance * 1000}
            pathOptions={{
              color: '#2563eb',
              fillColor: '#2563eb',
              fillOpacity: 0.07,
              weight: 2,
              dashArray: '6, 4',
            }}
          />

          <Marker position={userLocation} icon={userIcon}>
            <Popup>
              <div className="text-center py-1">
                <p className="font-semibold text-gray-800">
                  {hasRealLocation ? 'Your Location' : 'Default Location'}
                </p>
                {!hasRealLocation && (
                  <p className="text-xs text-gray-500 mt-1">Addis Ababa, Ethiopia</p>
                )}
              </div>
            </Popup>
          </Marker>

          {clusters.map((cluster, idx) => {
            const isSingle = cluster.shops.length === 1;
            const shop = cluster.shops[0];

            if (isSingle) {
              const dist = shop._distance;
              return (
                <Marker
                  key={`shop-${shop.id}`}
                  position={[parseFloat(shop.latitude), parseFloat(shop.longitude)]}
                  icon={shopIcon}
                >
                  <Popup minWidth={200}>
                    <div className="w-52">
                      <p className="font-semibold text-gray-800 text-sm mb-1">{shop.name}</p>
                      {shop.address && (
                        <p className="text-xs text-gray-500 mb-1">{shop.address}</p>
                      )}
                      <span className="inline-block bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full mb-2">
                        {dist < 1
                          ? `${Math.round(dist * 1000)} m away`
                          : `${dist.toFixed(1)} km away`}
                      </span>
                      <div className="flex gap-2 mt-2">
                        <a
                          href={`/shops/${shop.id}`}
                          className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-xs py-1.5 rounded-lg font-medium transition-colors"
                        >
                          View Shop
                        </a>
                        <button
                          onClick={() =>
                            openDirections(parseFloat(shop.latitude), parseFloat(shop.longitude))
                          }
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-1"
                        >
                          <Navigation size={11} />
                          Directions
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            }

            return (
              <Marker
                key={`cluster-${idx}`}
                position={[cluster.lat, cluster.lng]}
                icon={clusterIcon(cluster.shops.length)}
              >
                <Popup minWidth={220}>
                  <div className="w-56">
                    <p className="font-semibold text-gray-800 text-sm mb-2">
                      {cluster.shops.length} shops nearby
                    </p>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {cluster.shops.map((s) => (
                        <div key={s.id} className="border border-gray-100 rounded-lg p-2">
                          <p className="font-medium text-xs text-gray-800">{s.name}</p>
                          {s.address && (
                            <p className="text-xs text-gray-500">{s.address}</p>
                          )}
                          <span className="inline-block bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full mt-1">
                            {s._distance < 1
                              ? `${Math.round(s._distance * 1000)} m`
                              : `${s._distance.toFixed(1)} km`}
                          </span>
                          <div className="flex gap-1 mt-1.5">
                            <a
                              href={`/shops/${s.id}`}
                              className="flex-1 text-center bg-blue-600 hover:bg-blue-700 text-white text-xs py-1 rounded font-medium transition-colors"
                            >
                              View
                            </a>
                            <button
                              onClick={() =>
                                openDirections(parseFloat(s.latitude), parseFloat(s.longitude))
                              }
                              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs py-1 rounded font-medium transition-colors"
                            >
                              Directions
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      <p className="mt-3 text-xs text-gray-400 dark:text-gray-500 text-center">
        Showing {filteredShops.length} of {shops.length} shops within {distance} km
        {hasRealLocation ? ' of your location' : ' of Addis Ababa'}
      </p>
    </motion.div>
  );
};

export default EnhancedMap;
