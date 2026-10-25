import React, { createContext, useContext, useState, useEffect } from 'react';
import { calculateRentalDuration } from '../utils/calculateRental';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'perfect_rent_cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [notification, setNotification] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to persist cart to localStorage:', e);
    }
  }, [cartItems]);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  /**
   * Generates a unique key for cart items based on clothingId, size, and date window.
   */
  const getCartItemKey = (clothingId, size, startDate = '', returnDate = '') => {
    return `${clothingId}_${size || 'M'}_${startDate || 'none'}_${returnDate || 'none'}`;
  };

  /**
   * Adds an item to the cart.
   * If the exact same item, size, and date range exists, increment quantity.
   */
  const addToCart = (clothingItem, options = {}) => {
    if (!clothingItem || !clothingItem.id) return;

    const size = options.size || clothingItem.size || 'M';
    const startDate = options.startDate || '';
    const returnDate = options.returnDate || '';
    const quantityToAdd = options.quantity || 1;
    const itemKey = getCartItemKey(clothingItem.id, size, startDate, returnDate);

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.cartKey === itemKey);

      if (existingIndex > -1) {
        const updated = [...prev];
        const newQty = updated[existingIndex].quantity + quantityToAdd;
        const maxStock = clothingItem.quantity || 5;
        updated[existingIndex].quantity = Math.min(newQty, maxStock);
        return updated;
      }

      const duration = startDate && returnDate ? calculateRentalDuration(startDate, returnDate) : 0;

      const newItem = {
        cartKey: itemKey,
        clothingId: clothingItem.id,
        name: clothingItem.name,
        image: clothingItem.image || (clothingItem.images && clothingItem.images[0]) || '',
        rentalPrice: clothingItem.rentalPrice,
        securityDeposit: clothingItem.securityDeposit || 0,
        maxStock: clothingItem.quantity || 1,
        condition: clothingItem.condition || 'GOOD',
        category: clothingItem.category?.name || clothingItem.category || 'Outfit',
        size,
        startDate,
        returnDate,
        durationDays: duration,
        quantity: quantityToAdd,
        rawItem: clothingItem,
      };

      return [...prev, newItem];
    });

    showToast(`Added "${clothingItem.name}" to your cart.`);
  };

  /**
   * Removes an item from the cart by its cartKey.
   */
  const removeFromCart = (cartKey) => {
    setCartItems((prev) => prev.filter((i) => i.cartKey !== cartKey));
  };

  /**
   * Updates an existing cart item's dates, size, or quantity.
   */
  const updateCartItem = (cartKey, updates) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartKey !== cartKey) return item;

        const updated = { ...item, ...updates };

        // Recalculate duration if dates changed
        if (updates.startDate !== undefined || updates.returnDate !== undefined) {
          const start = updates.startDate !== undefined ? updates.startDate : item.startDate;
          const end = updates.returnDate !== undefined ? updates.returnDate : item.returnDate;
          updated.durationDays = start && end ? calculateRentalDuration(start, end) : 0;
        }

        // Re-generate cartKey if identity fields changed
        updated.cartKey = getCartItemKey(
          updated.clothingId,
          updated.size,
          updated.startDate,
          updated.returnDate
        );

        return updated;
      })
    );
  };

  /**
   * Clears all items from the cart.
   */
  const clearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalCartCount,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        notification,
        showToast,
      }}
    >
      {children}
      {/* Global floating toast notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-fade-in bg-[#231F20] text-[#F4EFEA] border border-[#DFD5CD] px-5 py-3 shadow-xl flex items-center space-x-3 text-xs font-bold tracking-wider uppercase">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>{notification.message}</span>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
