import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, X, Share2, ShoppingCart,
  ChevronDown, Check, RefreshCw, CloudOff, Cloud,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { showSuccess, showError, showInfo } from './Toast';
import { shoppingAPI } from '../api/client';

// ─── helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (price) =>
  price != null
    ? `ETB ${Number(price).toLocaleString('en-ET', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : '';

const listToText = (list) => {
  const header = `📋 ${list.name}\n${'─'.repeat(30)}`;
  const items = list.items
    .map((item, i) => {
      const itemName = item.product_detail?.name || item.product?.name || 'Unknown Product';
      const price = item.estimated_price || 0;
      return `${i + 1}. ${itemName}${item.quantity > 1 ? ` ×${item.quantity}` : ''}${
        price ? `  –  ${formatPrice(price)}` : ''
      }`;
    })
    .join('\n');
  const total = list.items.reduce((sum, item) => sum + (item.estimated_price || 0), 0);
  return `${header}\n${items}\n${'─'.repeat(30)}\nTotal: ${formatPrice(total)}`;
};

// ─── sub-components ───────────────────────────────────────────────────────────

const SyncBadge = ({ synced }) =>
  synced ? (
    <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
      <Cloud size={12} /> Synced
    </span>
  ) : (
    <span className="flex items-center gap-1 text-xs text-amber-500 dark:text-amber-400">
      <CloudOff size={12} /> Local only
    </span>
  );

const QuantityControl = ({ value, onChange }) => (
  <div className="flex items-center gap-1">
    <button
      onClick={() => onChange(Math.max(1, value - 1))}
      className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
      aria-label="Decrease quantity"
    >−</button>
    <span className="w-5 text-center text-xs font-medium text-gray-700 dark:text-gray-200">{value}</span>
    <button
      onClick={() => onChange(value + 1)}
      className="w-5 h-5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-xs font-bold flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
      aria-label="Increase quantity"
    >+</button>
  </div>
);

const AddToListModal = ({ product, lists, onClose, onAdd, onCreateAndAdd }) => {
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreateAndAdd = () => {
    if (!newListName.trim()) return;
    onCreateAndAdd(newListName.trim(), product);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">Add to Shopping List</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 truncate">
          <span className="font-medium text-gray-800 dark:text-gray-200">{product?.name}</span>
        </p>
        {lists.length > 0 && (
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {lists.map((list) => (
              <button
                key={list.id}
                onClick={() => { onAdd(list.id, product); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-left"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{list.name}</span>
                <span className="text-xs text-gray-400 dark:text-gray-500">{list.items.length} items</span>
              </button>
            ))}
          </div>
        )}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          {creating ? (
            <div className="flex gap-2">
              <input
                autoFocus type="text" placeholder="New list name..."
                value={newListName} onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(); if (e.key === 'Escape') setCreating(false); }}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={handleCreateAndAdd} disabled={!newListName.trim()}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              ><Check size={16} /></button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
            >
              <Plus size={16} /> Create new list
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

const ShoppingList = ({ pendingProduct, onClearPending }) => {
  const { t } = useTranslation();
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [collapsedLists, setCollapsedLists] = useState({});

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const response = await shoppingAPI.list({ is_active: true });
      setLists(response.data);
      setSynced(true);
    } catch (error) {
      console.error('Failed to fetch shopping lists:', error);
      setSynced(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const createList = useCallback(async (name) => {
    const trimmed = name.trim();
    if (!trimmed) { showError('Please enter a list name'); return null; }
    if (lists.find((l) => l.name.toLowerCase() === trimmed.toLowerCase())) {
      showError('A list with that name already exists'); return null;
    }
    try {
      const response = await shoppingAPI.create({ name: trimmed });
      setLists((prev) => [...prev, response.data]);
      showSuccess(`List "${trimmed}" created`);
      return response.data.id;
    } catch (error) {
      showError('Failed to create list');
      return null;
    }
  }, [lists]);

  const deleteList = useCallback(async (listId) => {
    try {
      await shoppingAPI.delete(listId);
      setLists((prev) => {
        const list = prev.find((l) => l.id === listId);
        if (list) showSuccess(`List "${list.name}" deleted`);
        return prev.filter((l) => l.id !== listId);
      });
    } catch (error) {
      showError('Failed to delete list');
    }
  }, []);

  const addItemToList = useCallback(async (listId, product) => {
    try {
      await shoppingAPI.addProduct(listId, { product_id: product.id });
      await fetchLists();
      showSuccess(`"${product.name}" added to list`);
    } catch (error) {
      if (error.response?.status === 400) {
        showInfo(`"${product.name}" is already in this list`);
      } else {
        showError('Failed to add item to list');
      }
    }
  }, [fetchLists]);

  const removeItemFromList = useCallback(async (itemId) => {
    try {
      await shoppingAPI.deleteItem(itemId);
      await fetchLists();
      showSuccess('Item removed');
    } catch (error) {
      showError('Failed to remove item');
    }
  }, [fetchLists]);

  const updateItemQuantity = useCallback(async (itemId, quantity) => {
    try {
      await shoppingAPI.updateItem(itemId, { quantity });
      await fetchLists();
    } catch (error) {
      showError('Failed to update quantity');
    }
  }, [fetchLists]);

  const toggleItemCompletion = useCallback(async (itemId) => {
    try {
      await shoppingAPI.toggleItem(itemId);
      await fetchLists();
    } catch (error) {
      showError('Failed to toggle item completion');
    }
  }, [fetchLists]);

  const createAndAddToList = useCallback(async (name, product) => {
    const id = await createList(name);
    if (id) {
      await addItemToList(id, product);
    }
  }, [createList, addItemToList]);

  const shareList = useCallback(async (list) => {
    const text = listToText(list);
    try {
      if (navigator.share) { await navigator.share({ title: list.name, text }); showSuccess('List shared!'); }
      else { await navigator.clipboard.writeText(text); showSuccess('List copied to clipboard!'); }
    } catch { showError('Could not share list'); }
  }, []);

  const toggleCollapse = (listId) => {
    setCollapsedLists((prev) => ({ ...prev, [listId]: !prev[listId] }));
  };

  const handleCreateList = async () => {
    const id = await createList(newListName);
    if (id) { setNewListName(''); setShowNewListForm(false); }
  };

  const getTotal = (list) => list.total_estimated_cost || 0;

  return (
    <>
      <AnimatePresence>
        {pendingProduct && (
          <AddToListModal
            product={pendingProduct} lists={lists}
            onClose={onClearPending}
            onAdd={addItemToList}
            onCreateAndAdd={createAndAddToList}
          />
        )}
      </AnimatePresence>

      <motion.section
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8"
      >
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6">
          <div className="flex items-center gap-3">
            <ShoppingCart size={24} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Shopping Lists</h2>
            {loading ? <RefreshCw size={14} className="text-gray-400 animate-spin" /> : <SyncBadge synced={synced} />}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewListForm((v) => !v)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
          >
            <Plus size={16} /> New List
          </motion.button>
        </div>

        <AnimatePresence>
          {showNewListForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="flex gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  autoFocus type="text" placeholder="Enter list name..."
                  value={newListName} onChange={(e) => setNewListName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCreateList(); if (e.key === 'Escape') setShowNewListForm(false); }}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 focus:outline-none focus:border-blue-500 text-sm"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={handleCreateList} disabled={!newListName.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >Create</motion.button>
                <button onClick={() => setShowNewListForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-2" aria-label="Cancel">
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {lists.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
            <ShoppingCart size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">No shopping lists yet. Create one to get started!</p>
          </motion.div>
        )}

        <div className="space-y-4">
          <AnimatePresence initial={false}>
            {lists.map((list) => {
              const isCollapsed = collapsedLists[list.id];
              const total = getTotal(list);
              return (
                <motion.div
                  key={list.id}
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20, height: 0 }}
                  layout className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-700/50">
                    <button
                      onClick={() => toggleCollapse(list.id)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                      aria-expanded={!isCollapsed}
                    >
                      <motion.span animate={{ rotate: isCollapsed ? -90 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      </motion.span>
                      <span className="font-semibold text-gray-800 dark:text-gray-100 truncate">{list.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                        {list.total_items} item{list.total_items !== 1 ? 's' : ''}
                      </span>
                    </button>
                    {total > 0 && (
                      <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 flex-shrink-0">{formatPrice(total)}</span>
                    )}
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => shareList(list)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors rounded" aria-label="Share list" title="Share list">
                      <Share2 size={15} />
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => deleteList(list.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded" aria-label="Delete list" title="Delete list">
                      <Trash2 size={15} />
                    </motion.button>
                  </div>

                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }} className="overflow-hidden"
                      >
                        <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                          <AnimatePresence initial={false}>
                            {list.items.length === 0 ? (
                              <p className="text-center text-sm text-gray-400 dark:text-gray-500 py-6">No items yet</p>
                            ) : (
                              list.items.map((item) => (
                                <motion.div
                                  key={item.id}
                                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10, height: 0 }}
                                  layout className="flex items-center gap-3 px-4 py-3"
                                >
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                                      {item.product_detail?.name || item.product?.name || 'Unknown Product'}
                                    </p>
                                    {item.product_detail?.category && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.product_detail.category}</p>
                                    )}
                                  </div>
                                  <QuantityControl value={item.quantity || 1} onChange={(q) => updateItemQuantity(item.id, q)} />
                                  {item.estimated_price != null && (
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-24 text-right flex-shrink-0">
                                      {formatPrice(item.estimated_price)}
                                    </span>
                                  )}
                                  <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                                    onClick={() => removeItemFromList(item.id)}
                                    className="text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 transition-colors flex-shrink-0"
                                    aria-label="Remove item">
                                    <X size={16} />
                                  </motion.button>
                                </motion.div>
                              ))
                            )}
                          </AnimatePresence>
                        </div>
                        {list.items.length > 0 && (
                          <div className="flex justify-between items-center px-4 py-2 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700/50">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Created {new Date(list.created_at).toLocaleDateString()}
                            </span>
                            {total > 0 && (
                              <span className="text-sm font-bold text-gray-800 dark:text-gray-100">Total: {formatPrice(total)}</span>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.section>
    </>
  );
};

export default ShoppingList;
