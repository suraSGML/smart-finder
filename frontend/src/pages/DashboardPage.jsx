/**
 * Customer dashboard: notifications, saved searches, and profile.
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, User, Search, CheckCheck, Trash2, Loader } from 'lucide-react';
import { notificationsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

const NOTIFICATION_ICONS = {
  PRICE_DROP: '💰',
  BACK_IN_STOCK: '📦',
  NEW_SHOP: '🏪',
  TRENDING: '📈',
  SHOP_APPROVED: '✅',
  SHOP_REJECTED: '❌',
  NEW_REVIEW: '⭐',
  SYSTEM: '🔔',
};

const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('notifications');
  const [profileForm, setProfileForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    bio: user?.bio || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState(null);

  useEffect(() => {
    notificationsAPI.list()
      .then((res) => setNotifications(res.data.results || res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleMarkRead = async (id) => {
    await notificationsAPI.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllRead = async () => {
    await notificationsAPI.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDelete = async (id) => {
    await notificationsAPI.delete(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    const result = await updateUser(profileForm);
    setSavingProfile(false);
    setProfileMessage(result.success ? 'Profile updated successfully.' : 'Failed to update profile.');
    setTimeout(() => setProfileMessage(null), 3000);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome, {user?.first_name || user?.username}!
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your account and notifications</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {[
            { key: 'notifications', label: 'Notifications', icon: Bell, badge: unreadCount },
            { key: 'profile', label: 'Profile', icon: User },
          ].map(({ key, label, icon: Icon, badge }) => (
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
              {badge > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notifications tab */}
        {activeTab === 'notifications' && (
          <div>
            {unreadCount > 0 && (
              <div className="flex justify-end mb-3">
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
                >
                  <CheckCheck className="h-4 w-4" aria-hidden="true" />
                  Mark all as read
                </button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="h-8 w-8 text-blue-600 animate-spin" aria-label="Loading" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16 text-gray-500 bg-white rounded-xl">
                <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" aria-hidden="true" />
                <p>No notifications yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`bg-white rounded-xl p-4 flex items-start gap-3 shadow-sm transition-colors ${
                      !notification.is_read ? 'border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0" role="img" aria-label={notification.notification_type_display}>
                      {NOTIFICATION_ICONS[notification.notification_type] || '🔔'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className={`text-sm font-semibold ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                          {notification.title}
                        </h3>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">{notification.message}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkRead(notification.id)}
                          className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"
                          aria-label="Mark as read"
                          title="Mark as read"
                        >
                          <CheckCheck className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(notification.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        aria-label="Delete notification"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Edit Profile</h2>

            {profileMessage && (
              <div className={`rounded-lg p-3 mb-4 text-sm ${
                profileMessage.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`} role="status">
                {profileMessage}
              </div>
            )}

            <form onSubmit={handleProfileSave}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input
                    id="first_name"
                    type="text"
                    value={profileForm.first_name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, first_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div>
                  <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    id="last_name"
                    type="text"
                    value={profileForm.last_name}
                    onChange={(e) => setProfileForm((f) => ({ ...f, last_name: e.target.value }))}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  id="phone_number"
                  type="tel"
                  value={profileForm.phone_number}
                  onChange={(e) => setProfileForm((f) => ({ ...f, phone_number: e.target.value }))}
                  placeholder="+251912345678"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>

              <div className="mb-6">
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  id="bio"
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm((f) => ({ ...f, bio: e.target.value }))}
                  rows={3}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {savingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <div className="text-sm text-gray-500">
                  <span className="font-medium">Role:</span> {user?.role}
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
