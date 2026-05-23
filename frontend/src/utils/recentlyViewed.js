/**
 * Recently viewed products utility using localStorage.
 */

const STORAGE_KEY = 'recentlyViewed';
const MAX_ITEMS = 20;

/**
 * Add a product to the recently viewed list.
 * Moves it to the front if already present; trims to MAX_ITEMS.
 */
export const addRecentlyViewed = (product) => {
  if (!product || !product.id) return;

  try {
    const existing = getRecentlyViewed();
    const filtered = existing.filter((p) => p.id !== product.id);
    const updated = [
      {
        id: product.id,
        name: product.name,
        category: product.category,
        min_price: product.min_price,
        max_price: product.max_price,
        image: product.image,
        brand: product.brand,
        viewedAt: new Date().toISOString(),
      },
      ...filtered,
    ].slice(0, MAX_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save recently viewed:', err);
  }
};

/** Return the full recently viewed list, newest first. */
export const getRecentlyViewed = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};

/** Remove all recently viewed entries. */
export const clearRecentlyViewed = () => {
  localStorage.removeItem(STORAGE_KEY);
};

export default { addRecentlyViewed, getRecentlyViewed, clearRecentlyViewed };
