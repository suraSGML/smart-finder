/**
 * Admin dashboard: approve shops, manage users, view analytics.
 */
import React, { useState, useEffect } from 'react';
import { BarChart2, Store, Users, CheckCircle, XCircle, Loader, TrendingUp, Search, Package, Plus, Trash2, Edit2, Shield } from 'lucide-react';
import { analyticsAPI, shopsAPI, usersAPI, productsAPI } from '../api/client';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, color = 'text-blue-700', icon: Icon }) => (
  <div className="bg-white rounded-xl shadow-sm p-5 flex items-center gap-4">
    {Icon && <Icon className={`h-8 w-8 ${color} opacity-80`} aria-hidden="true" />}
    <div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [pendingShops, setPendingShops] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [userSearch, setUserSearch] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [editingRole, setEditingRole] = useState(null);
  const [newRole, setNewRole] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analyticsRes, shopsRes] = await Promise.all([
          analyticsAPI.adminSummary(),
          shopsAPI.adminList({ is_approved: false }),
        ]);
        setAnalytics(analyticsRes.data);
        setPendingShops(shopsRes.data.results || shopsRes.data);
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      usersAPI.list({ search: userSearch })
        .then((res) => setUsers(res.data.results || res.data))
        .catch(() => {});
    }
  }, [activeTab, userSearch]);

  const handleApproveShop = async (shopId, approve) => {
    try {
      await shopsAPI.approve(shopId, { is_approved: approve });
      setPendingShops((prev) => prev.filter((s) => s.id !== shopId));
      toast.success(approve ? 'Shop approved successfully.' : 'Shop rejected.');
    } catch {
      toast.error('Failed to update shop status.');
    }
  };

  const handleToggleUser = async (userId, isActive) => {
    try {
      await usersAPI.update(userId, { is_active: !isActive });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_active: !isActive } : u))
      );
      toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully.`);
    } catch {
      toast.error('Failed to update user.');
    }
  };

  const handleRoleChange = async (userId) => {
    try {
      await usersAPI.update(userId, { role: newRole });
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      toast.success('User role updated successfully.');
      setEditingRole(null);
      setNewRole('');
    } catch {
      toast.error('Failed to update user role.');
    }
  };

  const handleBulkActivate = async () => {
    if (selectedUsers.length === 0) return;
    try {
      await Promise.all(
        selectedUsers.map((userId) => usersAPI.update(userId, { is_active: true }))
      );
      setUsers((prev) =>
        prev.map((u) => (selectedUsers.includes(u.id) ? { ...u, is_active: true } : u))
      );
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length} user(s) activated successfully.`);
    } catch {
      toast.error('Failed to activate users.');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedUsers.length === 0) return;
    try {
      await Promise.all(
        selectedUsers.map((userId) => usersAPI.update(userId, { is_active: false }))
      );
      setUsers((prev) =>
        prev.map((u) => (selectedUsers.includes(u.id) ? { ...u, is_active: false } : u))
      );
      setSelectedUsers([]);
      toast.success(`${selectedUsers.length} user(s) deactivated successfully.`);
    } catch {
      toast.error('Failed to deactivate users.');
    }
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map((u) => u.id));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-10 w-10 text-blue-600 animate-spin" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <BarChart2 className="h-6 w-6 text-blue-600" aria-hidden="true" />
          Admin Dashboard
        </h1>

        {/* Stats grid */}
        {analytics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total Users" value={analytics.total_users} icon={Users} color="text-blue-700" />
            <StatCard label="Total Shops" value={analytics.total_shops} icon={Store} color="text-green-700" />
            <StatCard label="Pending Approval" value={analytics.pending_shops} icon={Store} color="text-yellow-600" />
            <StatCard label="Total Products" value={analytics.total_products} icon={TrendingUp} color="text-purple-700" />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {[
            { key: 'overview', label: 'Overview', icon: BarChart2 },
            { key: 'shops', label: `Pending Shops (${pendingShops.length})`, icon: Store },
            { key: 'users', label: 'Users', icon: Users },
          ].map(({ key, label, icon: Icon }) => (
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
            </button>
          ))}
        </div>

        {/* Overview tab */}
        {activeTab === 'overview' && analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top searches */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-blue-600" aria-hidden="true" />
                Top Searches (7 days)
              </h3>
              {analytics.top_queries?.length === 0 ? (
                <p className="text-gray-400 text-sm">No search data yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.top_queries?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.query}</span>
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top products */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
                Top Products (7 days)
              </h3>
              {analytics.top_products?.length === 0 ? (
                <p className="text-gray-400 text-sm">No product view data yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.top_products?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">{item.product__name}</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        {item.view_count} views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Daily stats */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Today's Activity</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-bold text-blue-700">{analytics.searches_today}</div>
                  <div className="text-sm text-gray-500">Searches Today</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{analytics.new_users_today}</div>
                  <div className="text-sm text-gray-500">New Users Today</div>
                </div>
              </div>
            </div>

            {/* Top shops */}
            <div className="bg-white rounded-xl shadow-sm p-5">
              <h3 className="font-semibold text-gray-800 mb-4">Top Shops (7 days)</h3>
              {analytics.top_shops?.length === 0 ? (
                <p className="text-gray-400 text-sm">No shop view data yet.</p>
              ) : (
                <div className="space-y-2">
                  {analytics.top_shops?.map((item, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-700">{item.shop__name}</span>
                        <span className="text-xs text-gray-400 ml-2">{item.shop__city}</span>
                      </div>
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                        {item.view_count} views
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending shops tab */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            {pendingShops.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl text-gray-500">
                <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-300" aria-hidden="true" />
                <p>No shops pending approval.</p>
              </div>
            ) : (
              pendingShops.map((shop) => (
                <div key={shop.id} className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xl font-bold text-blue-600">{shop.name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800">{shop.name}</h3>
                    <p className="text-sm text-gray-500">{shop.address}, {shop.city}</p>
                    <p className="text-sm text-gray-500">
                      Owner: {shop.owner_detail?.full_name || shop.owner_detail?.username}
                      {shop.owner_detail?.email && ` (${shop.owner_detail.email})`}
                    </p>
                    {shop.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{shop.description}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleApproveShop(shop.id, true)}
                      className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <CheckCircle className="h-4 w-4" aria-hidden="true" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleApproveShop(shop.id, false)}
                      className="flex items-center gap-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                    >
                      <XCircle className="h-4 w-4" aria-hidden="true" />
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Users tab */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-4 flex gap-4 items-center">
              <div className="relative max-w-sm flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search users..."
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              {selectedUsers.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handleBulkActivate}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" /> Activate ({selectedUsers.length})
                  </button>
                  <button
                    onClick={handleBulkDeactivate}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    <XCircle className="h-4 w-4" /> Deactivate ({selectedUsers.length})
                  </button>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600 w-10">
                      <input
                        type="checkbox"
                        checked={selectedUsers.length === users.length && users.length > 0}
                        onChange={handleSelectAll}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Role</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Joined</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(u.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUsers([...selectedUsers, u.id]);
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== u.id));
                            }
                          }}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-800">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-gray-500">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        {editingRole === u.id ? (
                          <div className="flex items-center gap-2">
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value)}
                              className="text-xs border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="CUSTOMER">Customer</option>
                              <option value="SHOP_OWNER">Shop Owner</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                            <button
                              onClick={() => handleRoleChange(u.id)}
                              className="text-green-600 hover:text-green-700"
                              title="Save"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => { setEditingRole(null); setNewRole(''); }}
                              className="text-gray-400 hover:text-gray-600"
                              title="Cancel"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                              u.role === 'SHOP_OWNER' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {u.role}
                            </span>
                            <button
                              onClick={() => { setEditingRole(u.id); setNewRole(u.role); }}
                              className="text-gray-400 hover:text-blue-600"
                              title="Edit role"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          u.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleToggleUser(u.id, u.is_active)}
                          className={`text-xs font-medium px-3 py-1 rounded-lg transition-colors ${
                            u.is_active
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
