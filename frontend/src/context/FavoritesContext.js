import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { usersAPI } from '../api/client';

const FavoritesContext = createContext();

const LS_KEY = 'favorites';
const LS_VIEWED = 'recentlyViewed';
const LS_LISTS = 'shoppingLists';

export const FavoritesProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [shoppingLists, setShoppingLists] = useState([]);

  // Load favorites: from backend if logged in, else localStorage
  const loadFavorites = useCallback(async () => {
    if (isAuthenticated) {
      try {
        const res = await usersAPI.favorites();
        const items = res.data.results || res.data;
        // Extract product details from favorites
        const products = items.map(fav => fav.product_detail || fav.product).filter(Boolean);
        setFavorites(products);
        localStorage.setItem(LS_KEY, JSON.stringify(products));
        return;
      } catch {
        // Fall through to localStorage
      }
    }
    setFavorites(JSON.parse(localStorage.getItem(LS_KEY) || '[]'));
  }, [isAuthenticated]);

  useEffect(() => {
    loadFavorites();
    setRecentlyViewed(JSON.parse(localStorage.getItem(LS_VIEWED) || '[]'));
    setShoppingLists(JSON.parse(localStorage.getItem(LS_LISTS) || '[]'));
  }, [loadFavorites]);

  useEffect(() => {
    localStorage.setItem(LS_VIEWED, JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  useEffect(() => {
    localStorage.setItem(LS_LISTS, JSON.stringify(shoppingLists));
  }, [shoppingLists]);

  const addFavorite = async (product) => {
    if (favorites.find((f) => f.id === product.id)) return;
    const updated = [...favorites, product];
    setFavorites(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    if (isAuthenticated) {
      try {
        await usersAPI.addFavorite({ product: product.id });
      } catch {
        // Optimistic update already applied
      }
    }
  };

  const removeFavorite = async (productId) => {
    const updated = favorites.filter((f) => f.id !== productId);
    setFavorites(updated);
    localStorage.setItem(LS_KEY, JSON.stringify(updated));
    if (isAuthenticated) {
      try {
        // Find the favorite ID first
        const res = await usersAPI.favorites();
        const items = res.data.results || res.data;
        const favorite = items.find(f => (f.product_detail?.id || f.product?.id) === productId);
        if (favorite) {
          await usersAPI.removeFavorite(favorite.id);
        }
      } catch {
        // Optimistic update already applied
      }
    }
  };

  const isFavorite = (productId) => favorites.some((f) => f.id === productId);

  const addRecentlyViewed = (product) => {
    const filtered = recentlyViewed.filter((r) => r.id !== product.id);
    setRecentlyViewed([product, ...filtered].slice(0, 20));
  };

  const addToShoppingList = (listName, product) => {
    setShoppingLists((prev) => {
      const existing = prev.find((l) => l.name === listName);
      if (existing) {
        if (existing.items.find((i) => i.id === product.id)) return prev;
        return prev.map((l) =>
          l.name === listName ? { ...l, items: [...l.items, product] } : l
        );
      }
      return [...prev, { name: listName, items: [product], createdAt: new Date().toISOString() }];
    });
  };

  const removeFromShoppingList = (listName, productId) => {
    setShoppingLists((prev) =>
      prev.map((l) =>
        l.name === listName ? { ...l, items: l.items.filter((i) => i.id !== productId) } : l
      )
    );
  };

  const deleteShoppingList = (listName) => {
    setShoppingLists((prev) => prev.filter((l) => l.name !== listName));
  };

  return (
    <FavoritesContext.Provider
      value={{
        favorites,
        recentlyViewed,
        shoppingLists,
        addFavorite,
        removeFavorite,
        isFavorite,
        addRecentlyViewed,
        addToShoppingList,
        removeFromShoppingList,
        deleteShoppingList,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) throw new Error('useFavorites must be used within FavoritesProvider');
  return context;
};
