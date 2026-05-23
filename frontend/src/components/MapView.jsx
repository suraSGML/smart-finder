/**
 * Leaflet map component showing shop markers with popups.
 */
import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';

// Fix default marker icons for webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom colored marker factory
const createColoredIcon = (color = '#2563eb') =>
  L.divIcon({
    className: '',
    html: `
      <div style="
        width: 28px; height: 28px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
    popupAnchor: [0, -30],
  });

const userIcon = L.divIcon({
  className: '',
  html: `
    <div style="
      width: 16px; height: 16px;
      background: #ef4444;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(239,68,68,0.3);
    "></div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Component to fly to a location
const FlyToLocation = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom || 14, { duration: 1.5 });
    }
  }, [center, zoom, map]);
  return null;
};

const MapView = ({
  shops = [],
  userLocation = null,
  selectedShop = null,
  onShopClick,
  height = '500px',
  center = [9.0192, 38.7525], // Addis Ababa default
  zoom = 12,
}) => {
  const mapRef = useRef(null);

  const getMarkerColor = (shop) => {
    if (selectedShop?.id === shop.id) return '#f59e0b';
    if (shop.rating >= 4) return '#16a34a';
    if (shop.rating >= 3) return '#2563eb';
    return '#6b7280';
  };

  return (
    <div style={{ height }} className="rounded-xl overflow-hidden border border-gray-200 shadow-md">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Fly to selected shop */}
        {selectedShop?.latitude && selectedShop?.longitude && (
          <FlyToLocation
            center={[parseFloat(selectedShop.latitude), parseFloat(selectedShop.longitude)]}
            zoom={16}
          />
        )}

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lon]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-sm font-medium text-gray-700">Your Location</div>
            </Popup>
          </Marker>
        )}

        {/* Shop markers */}
        {shops
          .filter((shop) => shop.latitude && shop.longitude)
          .map((shop) => (
            <Marker
              key={shop.id}
              position={[parseFloat(shop.latitude), parseFloat(shop.longitude)]}
              icon={createColoredIcon(getMarkerColor(shop))}
              eventHandlers={{
                click: () => onShopClick && onShopClick(shop),
              }}
            >
              <Popup>
                <div className="min-w-[180px]">
                  <h3 className="font-semibold text-gray-800 text-sm mb-1">{shop.name}</h3>
                  <p className="text-xs text-gray-500 mb-1">{shop.address}</p>
                  {shop.rating > 0 && (
                    <p className="text-xs text-yellow-600 mb-2">
                      ★ {parseFloat(shop.rating).toFixed(1)} ({shop.review_count} reviews)
                    </p>
                  )}
                  {shop.distance != null && (
                    <p className="text-xs text-blue-600 mb-2">
                      📍 {shop.distance < 1
                        ? `${(shop.distance * 1000).toFixed(0)}m away`
                        : `${shop.distance.toFixed(1)} km away`}
                    </p>
                  )}
                  <Link
                    to={`/shops/${shop.id}`}
                    className="block text-center bg-blue-600 text-white text-xs py-1.5 px-3 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    View Shop
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
