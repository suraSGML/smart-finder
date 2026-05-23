/**
 * Responsive navigation bar with role-based links and notification badge.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Bell, ShoppingBag, MapPin, User, LogOut, BarChart2, Moon, Sun, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { notificationsAPI } from '../api/client';

const Navbar = () => {
  const { user, isAuthenticated, isShopOwner, isAdmin, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { i18n, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
      notificationsAPI.unreadCount()
        .then((res) => setUnreadCount(res.data.unread_count))
        .catch(() => {});
    }
  }, [isAuthenticated, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMenuOpen(false);
  };

  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    setLangMenuOpen(false);
  };

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-700 text-white'
        : 'text-gray-300 hover:bg-blue-600 hover:text-white'
    }`;

  return (
    <nav className="bg-blue-800 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <ShoppingBag className="h-8 w-8 text-yellow-400" />
            <span className="text-white font-bold text-lg hidden sm:block">
              Smart Finder
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className={navLinkClass('/')}>{t('common.home')}</Link>
            <Link to="/map" className={navLinkClass('/map')}>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" /> {t('common.map')}
              </span>
            </Link>

            {isShopOwner && (
              <Link to="/shop-dashboard" className={navLinkClass('/shop-dashboard')}>
                {t('common.dashboard')}
              </Link>
            )}

            {isAdmin && (
              <Link to="/admin-dashboard" className={navLinkClass('/admin-dashboard')}>
                <span className="flex items-center gap-1">
                  <BarChart2 className="h-4 w-4" /> Admin
                </span>
              </Link>
            )}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-300 hover:text-white transition-colors"
              title={isDark ? t('common.lightMode') : t('common.darkMode')}
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Language Switcher */}
            <div className="relative group">
              <button className="flex items-center space-x-1 text-gray-300 hover:text-white px-3 py-2 rounded-md">
                <Globe className="h-5 w-5" />
                <span className="text-sm font-medium uppercase">{i18n.language}</span>
              </button>
              <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    i18n.language === 'en'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => handleLanguageChange('am')}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    i18n.language === 'am'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  አማርኛ
                </button>
                <button
                  onClick={() => handleLanguageChange('or')}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    i18n.language === 'or'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  Afaan Oromoo
                </button>
                <button
                  onClick={() => handleLanguageChange('ti')}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    i18n.language === 'ti'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-bold'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  ትግርኛ
                </button>
              </div>
            </div>

            {isAuthenticated ? (
              <>
                {/* Notifications */}
                <Link
                  to="/dashboard"
                  className="relative p-2 text-gray-300 hover:text-white"
                  aria-label="Notifications"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User menu */}
                <div className="relative group">
                  <button className="flex items-center space-x-2 text-gray-300 hover:text-white px-3 py-2 rounded-md">
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">{user?.first_name || user?.username}</span>
                  </button>
                  <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 hidden group-hover:block z-50">
                    <Link
                      to="/dashboard"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {t('common.dashboard')}
                    </Link>
                    <Link
                      to="/profile/edit"
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Edit Profile
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" /> {t('common.logout')}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                >
                  {t('common.login')}
                </Link>
                <Link
                  to="/register"
                  className="bg-yellow-400 text-blue-900 hover:bg-yellow-300 px-4 py-2 rounded-md text-sm font-bold transition-colors"
                >
                  {t('common.register')}
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-blue-900 dark:bg-blue-950 px-4 pt-2 pb-4 space-y-1">
          <Link to="/" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMenuOpen(false)}>{t('common.home')}</Link>
          <Link to="/map" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMenuOpen(false)}>{t('common.map')}</Link>

          {isShopOwner && (
            <Link to="/shop-dashboard" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMenuOpen(false)}>{t('common.dashboard')}</Link>
          )}
          {isAdmin && (
            <Link to="/admin-dashboard" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMenuOpen(false)}>Admin</Link>
          )}

          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full text-left px-3 py-2 text-gray-300 hover:text-white rounded-md flex items-center gap-2"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDark ? t('common.lightMode') : t('common.darkMode')}
          </button>

          {/* Mobile Language Switcher */}
          <div className="px-3 py-2">
            <p className="text-gray-300 text-sm font-medium mb-2">{t('common.language')}</p>
            <div className="space-y-1">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full text-left px-2 py-1 text-sm rounded ${
                  i18n.language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                English
              </button>
              <button
                onClick={() => handleLanguageChange('am')}
                className={`w-full text-left px-2 py-1 text-sm rounded ${
                  i18n.language === 'am'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                አማርኛ
              </button>
              <button
                onClick={() => handleLanguageChange('or')}
                className={`w-full text-left px-2 py-1 text-sm rounded ${
                  i18n.language === 'or'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                Afaan Oromoo
              </button>
              <button
                onClick={() => handleLanguageChange('ti')}
                className={`w-full text-left px-2 py-1 text-sm rounded ${
                  i18n.language === 'ti'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                ትግርኛ
              </button>
            </div>
          </div>

          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMenuOpen(false)}>
                {t('common.dashboard')} {unreadCount > 0 && <span className="ml-2 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </Link>
              <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-red-400 hover:text-red-300 rounded-md flex items-center gap-2">
                <LogOut className="h-4 w-4" /> {t('common.logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="block px-3 py-2 text-gray-300 hover:text-white rounded-md" onClick={() => setMenuOpen(false)}>{t('common.login')}</Link>
              <Link to="/register" className="block px-3 py-2 bg-yellow-400 text-blue-900 font-bold rounded-md" onClick={() => setMenuOpen(false)}>{t('common.register')}</Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
