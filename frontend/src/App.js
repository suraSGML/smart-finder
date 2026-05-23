/**
 * Root application component with React Router setup and protected routes.
 * Uses React.lazy + Suspense for code-split page loading.
 */
import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { FavoritesProvider } from './context/FavoritesContext';
import Navbar from './components/Navbar';
import BackToTop from './components/BackToTop';
import Breadcrumbs from './components/Breadcrumbs';
import ProgressBar from './components/ProgressBar';
import KeyboardShortcuts from './components/KeyboardShortcuts';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'react-hot-toast';
import './i18n/config';

// Lazy-loaded pages for code splitting
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ProfileEditPage = lazy(() => import('./pages/ProfileEditPage'));
const HomePage = lazy(() => import('./pages/HomePage'));
const SearchResultsPage = lazy(() => import('./pages/SearchResultsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const ProductAddPage = lazy(() => import('./pages/ProductAddPage'));
const ProductEditPage = lazy(() => import('./pages/ProductEditPage'));
const ShopCreatePage = lazy(() => import('./pages/ShopCreatePage'));
const ShopDetailPage = lazy(() => import('./pages/ShopDetailPage'));
const ShopEditPage = lazy(() => import('./pages/ShopEditPage'));
const ShopsListPage = lazy(() => import('./pages/ShopsListPage'));
const MapPage = lazy(() => import('./pages/MapPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const ShopOwnerDashboard = lazy(() => import('./pages/ShopOwnerDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const PriceAlertsPage = lazy(() => import('./pages/PriceAlertsPage'));
const ComparisonPage = lazy(() => import('./pages/ComparisonPage'));
const BarcodeScannerPage = lazy(() => import('./pages/BarcodeScannerPage'));

/**
 * Spinner shown while a lazy page chunk is loading.
 */
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div
      className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"
      aria-label="Loading page"
    />
  </div>
);

/**
 * Route guard: redirects unauthenticated users to login.
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Route guard: redirects authenticated users away from auth pages.
 */
const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" aria-label="Loading" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

/**
 * Layout wrapper with Navbar.
 */
const Layout = ({ children }) => (
  <div className="min-h-screen flex flex-col">
    <Navbar />
    <ProgressBar />
    <KeyboardShortcuts />
    <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
      <Breadcrumbs />
      {children}
    </main>
    <BackToTop />
    <footer className="bg-blue-900 dark:bg-blue-950 text-blue-200 text-center py-4 text-sm">
      <p>© {new Date().getFullYear()} Smart Finder Ethiopia. Find the best prices near you.</p>
    </footer>
  </div>
);

/**
 * App routes configuration.
 * All page components are wrapped in a single Suspense boundary.
 */
const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* Public routes */}
      <Route
        path="/"
        element={
          <Layout>
            <HomePage />
          </Layout>
        }
      />
      <Route
        path="/search"
        element={
          <Layout>
            <SearchResultsPage />
          </Layout>
        }
      />
      <Route
        path="/shops"
        element={
          <Layout>
            <ShopsListPage />
          </Layout>
        }
      />
      <Route
        path="/shops/create"
        element={
          <ProtectedRoute requiredRole="SHOP_OWNER">
            <Layout>
              <ShopCreatePage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops/:id"
        element={
          <Layout>
            <ShopDetailPage />
          </Layout>
        }
      />
      <Route
        path="/shops/:id/edit"
        element={
          <ProtectedRoute requiredRole="SHOP_OWNER">
            <Layout>
              <ShopEditPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/add"
        element={
          <ProtectedRoute requiredRole="SHOP_OWNER">
            <Layout>
              <ProductAddPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products/:id"
        element={
          <Layout>
            <ProductDetailPage />
          </Layout>
        }
      />
      <Route
        path="/products/:id/edit"
        element={
          <ProtectedRoute requiredRole="SHOP_OWNER">
            <Layout>
              <ProductEditPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/map"
        element={
          <Layout>
            <MapPage />
          </Layout>
        }
      />
      <Route
        path="/compare"
        element={
          <Layout>
            <ComparisonPage />
          </Layout>
        }
      />
      <Route
        path="/scanner"
        element={
          <Layout>
            <BarcodeScannerPage />
          </Layout>
        }
      />

      {/* Auth routes (redirect if already logged in) */}
      <Route
        path="/forgot-password"
        element={<ForgotPasswordPage />}
      />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      {/* Protected routes */}
      <Route
        path="/profile/edit"
        element={
          <ProtectedRoute>
            <Layout>
              <ProfileEditPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Layout>
              <UserDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute>
            <Layout>
              <FavoritesPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/price-alerts"
        element={
          <ProtectedRoute>
            <Layout>
              <PriceAlertsPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/notifications"
        element={
          <ProtectedRoute>
            <Layout>
              <DashboardPage />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shop-dashboard"
        element={
          <ProtectedRoute requiredRole="SHOP_OWNER">
            <Layout>
              <ShopOwnerDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin-dashboard"
        element={
          <ProtectedRoute requiredRole="ADMIN">
            <Layout>
              <AdminDashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* 404 fallback */}
      <Route
        path="*"
        element={
          <Layout>
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
              <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
              <p className="text-xl text-gray-600 mb-6">Page not found</p>
              <a href="/" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors">
                Go Home
              </a>
            </div>
          </Layout>
        }
      />
    </Routes>
  </Suspense>
);

/**
 * Root App component.
 */
const App = () => (
  <BrowserRouter>
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <FavoritesProvider>
            <Toaster position="top-right" />
            <AppRoutes />
          </FavoritesProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  </BrowserRouter>
);

export default App;
