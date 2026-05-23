/**
 * Axios HTTP client with JWT authentication interceptors.
 * Automatically attaches access tokens and handles token refresh.
 */
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // Increased from 15s to 30s to handle slow database connections
});

// Request interceptor: attach JWT access token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Public routes that should never trigger a redirect on 401
const PUBLIC_PATHS = ['/search', '/shops', '/products', '/compare', '/reviews'];
const isPublicPath = (url = '') =>
  PUBLIC_PATHS.some((p) => url.includes(p));

// Response interceptor: handle 401 and refresh token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || '';

    // Only attempt token refresh for authenticated endpoints, not public ones
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isPublicPath(requestUrl)
    ) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Don't redirect — just reject so the caller handles it
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${BASE_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });
        const { access } = response.data;
        localStorage.setItem('access_token', access);
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoint helpers
export const authAPI = {
  register: (data) => apiClient.post('/users/register/', data),
  login: (data) => apiClient.post('/users/login/', data),
  logout: (refresh) => apiClient.post('/users/logout/', { refresh }),
  getProfile: () => apiClient.get('/users/profile/'),
  updateProfile: (data) => apiClient.patch('/users/profile/', data),
  changePassword: (data) => apiClient.post('/users/profile/change-password/', data),
  requestPasswordReset: (data) => apiClient.post('/users/password-reset/', data),
  confirmPasswordReset: (data) => apiClient.post('/users/password-reset/confirm/', data),
};

export const shopsAPI = {
  list: (params) => apiClient.get('/shops/', { params }),
  create: (data) => apiClient.post('/shops/create/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  get: (id) => apiClient.get(`/shops/${id}/`),
  update: (id, data) => apiClient.patch(`/shops/${id}/`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  delete: (id) => apiClient.delete(`/shops/${id}/`),
  nearby: (params) => apiClient.get('/shops/nearby/', { params }),
  myShops: () => apiClient.get('/shops/my-shops/'),
  approve: (id, data) => apiClient.patch(`/shops/admin/${id}/approve/`, data),
  adminList: (params) => apiClient.get('/shops/admin/all/', { params }),
  clusters: (params) => apiClient.get('/shops/clusters/', { params }),
};

export const productsAPI = {
  list: (params) => apiClient.get('/products/', { params }),
  create: (data) => apiClient.post('/products/create/', data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  get: (id) => apiClient.get(`/products/${id}/`),
  update: (id, data) => apiClient.patch(`/products/${id}/`, data, {
    headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {},
  }),
  byCategory: (category) => apiClient.get(`/products/category/${category}/`),
  shopProducts: (params) => apiClient.get('/products/shop-products/', { params }),
  createShopProduct: (data) => apiClient.post('/products/shop-products/create/', data),
  updateShopProduct: (id, data) => apiClient.patch(`/products/shop-products/${id}/`, data),
  deleteShopProduct: (id) => apiClient.delete(`/products/shop-products/${id}/`),
  shopInventory: (shopId) => apiClient.get(`/products/shop/${shopId}/inventory/`),
  myInventory: () => apiClient.get('/products/shop-products/my-inventory/'),
  priceHistory: (shopProductId) => apiClient.get(`/products/shop-products/${shopProductId}/price-history/`),
  barcodeLookup: (barcode) => apiClient.get(`/products/barcode/${barcode}/`),
};

export const searchAPI = {
  search: (params) => apiClient.get('/search/', { params }),
  suggestions: (params) => apiClient.get('/search/suggestions/', { params }),
  trending: () => apiClient.get('/search/trending/'),
};

export const comparisonAPI = {
  compareProduct: (productId, params) =>
    apiClient.get(`/compare/product/${productId}/`, { params }),
  compareMultiple: (params) => apiClient.get('/compare/products/', { params }),
  exportPDF: (productId, params) =>
    apiClient.get(`/compare/product/${productId}/export/pdf/`, { 
      params,
      responseType: 'blob',
    }),
};

export const reviewsAPI = {
  list: (params) => apiClient.get('/reviews/', { params }),
  shopReviews: (shopId, params) => apiClient.get(`/reviews/shop/${shopId}/`, { params }),
  create: (data) => apiClient.post('/reviews/create/', data),
  get: (id) => apiClient.get(`/reviews/${id}/`),
  update: (id, data) => apiClient.patch(`/reviews/${id}/`, data),
  delete: (id) => apiClient.delete(`/reviews/${id}/`),
  myReviews: () => apiClient.get('/reviews/my/'),
  vote: (id, data) => apiClient.post(`/reviews/${id}/vote/`, data),
  markHelpful: (id) => apiClient.post(`/reviews/${id}/helpful/`),
};

export const notificationsAPI = {
  list: (params) => apiClient.get('/notifications/', { params }),
  unreadCount: () => apiClient.get('/notifications/unread-count/'),
  markRead: (id) => apiClient.patch(`/notifications/${id}/read/`),
  markAllRead: () => apiClient.post('/notifications/mark-all-read/'),
  delete: (id) => apiClient.delete(`/notifications/${id}/`),
};

export const analyticsAPI = {
  adminSummary: () => apiClient.get('/analytics/admin/summary/'),
  shopOwner: () => apiClient.get('/analytics/shop-owner/'),
  userDashboard: () => apiClient.get('/analytics/user/'),
  summary: () => apiClient.get('/analytics/summary/'), // Legacy, kept for compatibility
  trackShopView: (shopId) => apiClient.post(`/analytics/track/shop/${shopId}/`),
};

export const usersAPI = {
  list: (params) => apiClient.get('/users/', { params }),
  get: (id) => apiClient.get(`/users/${id}/`),
  update: (id, data) => apiClient.patch(`/users/${id}/`, data),
  favorites: () => apiClient.get('/users/favorites/'),
  addFavorite: (data) => apiClient.post('/users/favorites/', data),
  removeFavorite: (id) => apiClient.delete(`/users/favorites/${id}/`),
  toggleFavorite: (data) => apiClient.post('/users/favorites/toggle/', data),
  priceAlerts: (params) => apiClient.get('/users/price-alerts/', { params }),
  createPriceAlert: (data) => apiClient.post('/users/price-alerts/', data),
  updatePriceAlert: (id, data) => apiClient.patch(`/users/price-alerts/${id}/`, data),
  deletePriceAlert: (id) => apiClient.delete(`/users/price-alerts/${id}/`),
};

export const shoppingAPI = {
  list: (params) => apiClient.get('/shopping/', { params }),
  create: (data) => apiClient.post('/shopping/', data),
  get: (id) => apiClient.get(`/shopping/${id}/`),
  update: (id, data) => apiClient.patch(`/shopping/${id}/`, data),
  delete: (id) => apiClient.delete(`/shopping/${id}/`),
  summary: () => apiClient.get('/shopping/summary/'),
  items: (listId, params) => apiClient.get(`/shopping/${listId}/items/`, { params }),
  createItem: (listId, data) => apiClient.post(`/shopping/${listId}/items/`, data),
  getItem: (itemId) => apiClient.get(`/shopping/items/${itemId}/`),
  updateItem: (itemId, data) => apiClient.patch(`/shopping/items/${itemId}/`, data),
  deleteItem: (itemId) => apiClient.delete(`/shopping/items/${itemId}/`),
  toggleItem: (itemId) => apiClient.post(`/shopping/items/${itemId}/toggle/`),
  addProduct: (listId, data) => apiClient.post(`/shopping/${listId}/add-product/`, data),
};

export default apiClient;
