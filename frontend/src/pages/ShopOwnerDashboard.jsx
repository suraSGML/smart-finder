/**
 * Shop owner dashboard: manage shops, products, and view analytics.
 */
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Store, Package, Plus, Edit, Trash2, BarChart2, Loader, AlertCircle, CheckCircle, XCircle, Save, X } from 'lucide-react';
import { shopsAPI, productsAPI, analyticsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import AnalyticsCharts from '../components/AnalyticsCharts';
import toast from 'react-hot-toast';

const ShopOwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shops, setShops] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('shops');
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ price: '', stock_quantity: '', notes: '' });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [shopsRes, analyticsRes] = await Promise.all([
          shopsAPI.myShops(),
          analyticsAPI.shopOwner(),
        ]);
        const shopList = shopsRes.data.results || shopsRes.data;
        setShops(shopList);
        setAnalytics(analyticsRes.data);
        if (shopList.length > 0) {
          setSelectedShopId(shopList[0].id);
        }
      } catch {
        // Handle error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!selectedShopId) return;
      try {
        const res = await productsAPI.shopInventory(selectedShopId);
        setInventory(res.data.results || res.data);
      } catch (err) {
        console.error('Failed to load inventory:', err);
        setInventory([]);
      }
    };
    fetchInventory();
  }, [selectedShopId]);

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Remove this product from your shop?')) return;
    try {
      await productsAPI.deleteShopProduct(id);
      // Refresh inventory after delete to ensure data consistency
      const res = await productsAPI.shopInventory(selectedShopId);
      setInventory(res.data.results || res.data);
      toast.success('Product removed.');
    } catch (err) {
      console.error('Failed to remove product:', err);
      toast.error('Failed to remove product.');
    }
  };

  const handleToggleAvailability = async (sp) => {
    try {
      await productsAPI.updateShopProduct(sp.id, { availability: !sp.availability });
      // Refresh inventory after update to ensure data consistency
      const res = await productsAPI.shopInventory(selectedShopId);
      setInventory(res.data.results || res.data);
    } catch (err) {
      console.error('Failed to update availability:', err);
      toast.error('Failed to update availability.');
    }
  };

  const startEdit = (sp) => {
    setEditingId(sp.id);
    setEditForm({ price: sp.price, stock_quantity: sp.stock_quantity ?? '', notes: sp.notes ?? '' });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id) => {
    try {
      const updated = await productsAPI.updateShopProduct(id, {
        price: parseFloat(editForm.price),
        stock_quantity: editForm.stock_quantity !== '' ? parseInt(editForm.stock_quantity) : null,
        notes: editForm.notes || null,
      });
      // Refresh inventory after update to ensure data consistency
      const res = await productsAPI.shopInventory(selectedShopId);
      setInventory(res.data.results || res.data);
      setEditingId(null);
      toast.success('Updated successfully.');
    } catch (err) {
      console.error('Failed to save changes:', err);
      toast.error('Failed to save changes.');
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
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Shop Owner Dashboard</h1>
          <Link
            to="/shops/create"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add New Shop
          </Link>
        </div>

        {/* Analytics summary */}
        {analytics?.summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-blue-700">{analytics.summary.total_shops}</div>
              <div className="text-sm text-gray-500">Total Shops</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-green-700">{analytics.summary.approved_shops}</div>
              <div className="text-sm text-gray-500">Approved Shops</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-purple-700">{analytics.summary.total_inventory}</div>
              <div className="text-sm text-gray-500">Total Products</div>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <div className="text-2xl font-bold text-yellow-600">{analytics.summary.total_views}</div>
              <div className="text-sm text-gray-500">Total Views</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 mb-6">
          {[
            { key: 'shops', label: 'My Shops', icon: Store },
            { key: 'inventory', label: 'Inventory', icon: Package },
            { key: 'analytics', label: 'Analytics', icon: BarChart2 },
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

        {/* Shops tab */}
        {activeTab === 'shops' && (
          <div className="space-y-4">
            {shops.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl text-gray-500">
                <Store className="h-12 w-12 mx-auto mb-3 text-gray-300" aria-hidden="true" />
                <p className="mb-4">You haven't created any shops yet.</p>
                <Link to="/shops/create" className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Create Your First Shop
                </Link>
              </div>
            ) : (
              shops.map((shop) => (
                <div key={shop.id} className="bg-white rounded-xl shadow-sm p-5 flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {shop.logo ? (
                      <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      <span className="text-xl font-bold text-blue-600">{shop.name.charAt(0)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{shop.name}</h3>
                      {shop.is_approved ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          <CheckCircle className="h-3 w-3" aria-hidden="true" /> Approved
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded-full">
                          <AlertCircle className="h-3 w-3" aria-hidden="true" /> Pending Approval
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{shop.address}, {shop.city}</p>
                    <p className="text-sm text-gray-500">Rating: {parseFloat(shop.rating).toFixed(1)} ★ ({shop.review_count} reviews)</p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setSelectedShopId(shop.id); setActiveTab('inventory'); }}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      aria-label="Manage inventory"
                      title="Manage inventory"
                    >
                      <Package className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <Link
                      to={`/shops/${shop.id}/edit`}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                      aria-label="Edit shop"
                      title="Edit shop"
                    >
                      <Edit className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Inventory tab */}
        {activeTab === 'inventory' && (
          <div>
            {shops.length > 1 && (
              <div className="mb-4">
                <label htmlFor="shop-select" className="block text-sm font-medium text-gray-700 mb-1">Select Shop</label>
                <select
                  id="shop-select"
                  value={selectedShopId || ''}
                  onChange={(e) => setSelectedShopId(parseInt(e.target.value))}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  {shops.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end mb-4">
              <Link
                to="/products/add"
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add Product
              </Link>
            </div>

            {inventory.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-xl text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" aria-hidden="true" />
                <p>No products in this shop yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                      <th className="text-right px-4 py-3 font-semibold text-gray-600">Price (ETB)</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Stock</th>
                      <th className="text-center px-4 py-3 font-semibold text-gray-600">Available</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {inventory.map((sp) => (
                      <tr key={sp.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-800">{sp.product_detail?.name || 'Product'}</div>
                          <div className="text-xs text-gray-500">{sp.product_detail?.category_display}</div>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-800">
                          {editingId === sp.id ? (
                            <input type="number" min="0" step="0.01" value={editForm.price} onChange={e => setEditForm(f => ({ ...f, price: e.target.value }))} className="w-24 border border-blue-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          ) : Number(sp.price).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600">
                          {editingId === sp.id ? (
                            <input type="number" min="0" value={editForm.stock_quantity} onChange={e => setEditForm(f => ({ ...f, stock_quantity: e.target.value }))} className="w-16 border border-blue-300 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
                          ) : (sp.stock_quantity ?? '—')}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleToggleAvailability(sp)}
                            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full transition-colors ${
                              sp.availability ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                            }`}
                          >
                            {sp.availability ? (<><CheckCircle className="h-3 w-3" /> In Stock</>) : (<><XCircle className="h-3 w-3" /> Out</>)}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          {editingId === sp.id ? (
                            <div className="flex gap-1">
                              <button onClick={() => saveEdit(sp.id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg" title="Save"><Save className="h-4 w-4" /></button>
                              <button onClick={cancelEdit} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg" title="Cancel"><X className="h-4 w-4" /></button>
                            </div>
                          ) : (
                            <div className="flex gap-1">
                              <button onClick={() => startEdit(sp)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Edit"><Edit className="h-4 w-4" /></button>
                              <button onClick={() => handleDeleteProduct(sp.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg" title="Remove"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Analytics tab */}
        {activeTab === 'analytics' && analytics && (
          <div>
            <AnalyticsCharts analytics={analytics} />
            
            {/* Shop-specific stats */}
            {analytics.shops?.map((stat) => (
              <div key={stat.shop_id} className="bg-white rounded-xl shadow-sm p-5">
                <h3 className="font-semibold text-gray-800 mb-4">{stat.shop_name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-700">{stat.total_views}</div>
                    <div className="text-xs text-gray-500">Total Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-700">{stat.views_this_week}</div>
                    <div className="text-xs text-gray-500">This Week</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{stat.rating.toFixed(1)} ★</div>
                    <div className="text-xs text-gray-500">{stat.review_count} Reviews</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-700">{stat.product_count}</div>
                    <div className="text-xs text-gray-500">Products</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopOwnerDashboard;
