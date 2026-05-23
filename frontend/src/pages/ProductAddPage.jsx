/**
 * Add product to shop inventory page (shop owners only).
 * Searches existing products and links them to the owner's shop with a price.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Package, Plus, Loader } from 'lucide-react';
import { productsAPI, shopsAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ProductAddPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shops, setShops] = useState([]);
  const [selectedShopId, setSelectedShopId] = useState('');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [price, setPrice] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    shopsAPI.myShops()
      .then(res => {
        const list = res.data.results || res.data;
        setShops(list);
        if (list.length > 0) setSelectedShopId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const searchProducts = useCallback(async (q) => {
    if (q.length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const res = await productsAPI.list({ search: q, limit: 10 });
      setSearchResults(res.data.results || res.data);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchProducts(query), 300);
    return () => clearTimeout(t);
  }, [query, searchProducts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct) { toast.error('Please select a product.'); return; }
    if (!selectedShopId) { toast.error('Please select a shop.'); return; }
    if (!price || isNaN(price) || Number(price) <= 0) { toast.error('Enter a valid price.'); return; }

    setSubmitting(true);
    try {
      await productsAPI.createShopProduct({
        shop: parseInt(selectedShopId),
        product: selectedProduct.id,
        price: parseFloat(price),
        availability: true,
        stock_quantity: stockQty ? parseInt(stockQty) : null,
        notes: notes || null,
      });
      toast.success(`${selectedProduct.name} added to your shop!`);
      navigate('/shop-dashboard');
    } catch (err) {
      const data = err.response?.data;
      const msg = data?.non_field_errors?.[0] || Object.values(data || {}).flat()[0] || 'Failed to add product.';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-6">
        <ArrowLeft size={18} /> Back
      </button>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Add Product to Shop</h1>
      <p className="text-sm text-gray-500 mb-6">Search for an existing product and set your price.</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        {/* Shop selector */}
        {shops.length > 1 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Select Shop</label>
            <select
              value={selectedShopId}
              onChange={e => setSelectedShopId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              {shops.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        {/* Product search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Product</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedProduct(null); }}
              placeholder="Type product name, brand..."
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            {searching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-500 animate-spin" />}
          </div>

          {/* Results dropdown */}
          {searchResults.length > 0 && !selectedProduct && (
            <div className="mt-1 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              {searchResults.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => { setSelectedProduct(p); setQuery(p.name); setSearchResults([]); }}
                  className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                >
                  <Package className="h-4 w-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.category_display} {p.brand ? `· ${p.brand}` : ''}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedProduct && (
            <div className="mt-2 flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <Package className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">{selectedProduct.name}</span>
              <button type="button" onClick={() => { setSelectedProduct(null); setQuery(''); }} className="ml-auto text-xs text-blue-500 hover:text-blue-700">Change</button>
            </div>
          )}
        </div>

        {/* Price & stock */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (ETB) *</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="e.g. 1500"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock Quantity</label>
            <input
              type="number"
              min="0"
              value={stockQty}
              onChange={e => setStockQty(e.target.value)}
              placeholder="Optional"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder='e.g. "Imported", "Expires soon"'
            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting || !selectedProduct}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors"
          >
            {submitting ? <Loader className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {submitting ? 'Adding...' : 'Add to Shop'}
          </button>
          <button type="button" onClick={() => navigate(-1)} className="px-6 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductAddPage;
