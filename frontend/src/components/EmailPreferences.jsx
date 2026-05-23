import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Bell, Shield, CheckCircle, Loader } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usersAPI } from '../api/client';
import { showSuccess, showError } from './Toast';

const EmailPreferences = () => {
  const { user, isAuthenticated } = useAuth();
  const [preferences, setPreferences] = useState({
    email_notifications_enabled: true,
    price_alerts: true,
    favorite_updates: true,
    promotional_emails: false,
    weekly_digest: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadPreferences();
    }
  }, [isAuthenticated, user]);

  const loadPreferences = async () => {
    setLoading(true);
    try {
      // In production, this would fetch from the backend
      // For now, use localStorage as a demo
      const saved = localStorage.getItem('emailPreferences');
      if (saved) {
        setPreferences(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load email preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // In production, this would save to the backend
      // For now, save to localStorage as a demo
      localStorage.setItem('emailPreferences', JSON.stringify(preferences));
      
      // Also update user profile if backend supports it
      try {
        await usersAPI.update(user.id, { email_preferences: preferences });
      } catch {
        // Backend might not support this yet, that's okay
      }
      
      showSuccess('Email preferences saved successfully!');
    } catch (error) {
      showError('Failed to save email preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <Mail size={64} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Sign in to manage email preferences</h2>
        <p className="text-gray-600 dark:text-gray-400">You need to be logged in to access email settings.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size={32} className="text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Mail size={32} className="text-blue-600" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Email Preferences</h1>
      </div>

      {/* Main Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell size={24} className="text-blue-600" />
            <div>
              <h3 className="font-semibold text-gray-800 dark:text-gray-100">Email Notifications</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Enable or disable all email notifications
              </p>
            </div>
          </div>
          <button
            onClick={() => handleToggle('email_notifications_enabled')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              preferences.email_notifications_enabled ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <motion.span
              animate={{ x: preferences.email_notifications_enabled ? 28 : 2 }}
              className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
            />
          </button>
        </div>
      </div>

      {/* Individual Preferences */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Notification Types</h3>

        <div className="space-y-4">
          {/* Price Alerts */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">Price Alerts</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Get notified when products in your price alerts drop to your target price
              </div>
            </div>
            <button
              onClick={() => handleToggle('price_alerts')}
              disabled={!preferences.email_notifications_enabled}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                preferences.price_alerts && preferences.email_notifications_enabled
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              } ${!preferences.email_notifications_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <motion.span
                animate={{ x: preferences.price_alerts && preferences.email_notifications_enabled ? 28 : 2 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          {/* Favorite Updates */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">Favorite Updates</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Get notified about price changes and updates for your favorite products
              </div>
            </div>
            <button
              onClick={() => handleToggle('favorite_updates')}
              disabled={!preferences.email_notifications_enabled}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                preferences.favorite_updates && preferences.email_notifications_enabled
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              } ${!preferences.email_notifications_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <motion.span
                animate={{ x: preferences.favorite_updates && preferences.email_notifications_enabled ? 28 : 2 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          {/* Weekly Digest */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">Weekly Digest</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Receive a weekly summary of your activity and popular deals
              </div>
            </div>
            <button
              onClick={() => handleToggle('weekly_digest')}
              disabled={!preferences.email_notifications_enabled}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                preferences.weekly_digest && preferences.email_notifications_enabled
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              } ${!preferences.email_notifications_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <motion.span
                animate={{ x: preferences.weekly_digest && preferences.email_notifications_enabled ? 28 : 2 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>

          {/* Promotional Emails */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-100">Promotional Emails</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Receive special offers and promotions from partner shops
              </div>
            </div>
            <button
              onClick={() => handleToggle('promotional_emails')}
              disabled={!preferences.email_notifications_enabled}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                preferences.promotional_emails && preferences.email_notifications_enabled
                  ? 'bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              } ${!preferences.email_notifications_enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <motion.span
                animate={{ x: preferences.promotional_emails && preferences.email_notifications_enabled ? 28 : 2 }}
                className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-md"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6">
        <div className="flex items-start gap-3">
          <Shield size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Privacy & Security</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your email address is used solely for the notifications you've enabled. We never share your email with third parties. You can unsubscribe at any time.
            </p>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-medium transition-colors"
        >
          {saving ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <CheckCircle size={18} />
          )}
          Save Preferences
        </button>
      </div>

      {/* Note */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Note: This is a frontend demo. Email notifications require backend email service configuration.
      </p>
    </motion.div>
  );
};

export default EmailPreferences;
