'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export interface CartItem {
  _id: string;
  name: string;
  description: string;
  image?: string;
  size: 'small' | 'medium' | 'large' | 'single';
  price: number | null;
  quantity: number;
  restaurantId: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>) => boolean; // Returns true if added, false if different restaurant
  removeFromCart: (id: string, size: string) => void;
  updateQuantity: (id: string, size: string, quantity: number) => void;
  clearCart: () => void;
  replaceCart: (items: CartItem[]) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getCartRestaurantId: () => string | null; // Get the restaurantId of items in cart
  clearAndAddToCart: (item: Omit<CartItem, 'quantity'>) => void; // Clear cart and add new item from different restaurant
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  // Lazy initialization: load from localStorage only once during component mount
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Only run on client-side (Next.js safe)
    if (typeof window === 'undefined') return [];

    const storedCart = localStorage.getItem('cart');
    if (storedCart) {
      try {
        const parsedItems = JSON.parse(storedCart);
        // Filter out items without restaurantId (old cart items)
        const validItems = parsedItems.filter((item: any) => item.restaurantId);

        if (validItems.length !== parsedItems.length) {
          console.warn(
            'Removed cart items without restaurantId:',
            parsedItems.length - validItems.length
          );
        }

        return validItems;
      } catch (error) {
        console.error('Error loading cart from local storage:', error);
        localStorage.removeItem('cart'); // Clear invalid cart
        return [];
      }
    }
    return [];
  });

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, 'quantity'>): boolean => {
    let canAdd = true;

    setCartItems((prevItems) => {
      // Check if cart is empty or if item is from the same restaurant
      if (prevItems.length > 0 && prevItems[0].restaurantId !== item.restaurantId) {
        canAdd = false;
        return prevItems; // Don't add, return unchanged
      }

      const existingItem = prevItems.find((i) => i._id === item._id && i.size === item.size);

      if (existingItem) {
        return prevItems.map((i) =>
          i._id === item._id && i.size === item.size ? { ...i, quantity: i.quantity + 1 } : i
        );
      }

      return [...prevItems, { ...item, quantity: 1 }];
    });

    return canAdd;
  };

  const removeFromCart = (id: string, size: string) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => !(item._id === id && item.size === size))
    );
  };

  const updateQuantity = (id: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id, size);
      return;
    }

    setCartItems((prevItems) =>
      prevItems.map((item) =>
        item._id === id && item.size === size ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const replaceCart = useCallback((items: CartItem[]) => {
    setCartItems(items.filter((item) => item.restaurantId && item.quantity > 0));
  }, []);

  const getCartRestaurantId = (): string | null => {
    if (cartItems.length === 0) return null;
    return cartItems[0].restaurantId;
  };

  const clearAndAddToCart = (item: Omit<CartItem, 'quantity'>) => {
    setCartItems([{ ...item, quantity: 1 }]);
  };

  const getTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((total, item) => {
      const price = typeof item.price === 'number' && Number.isFinite(item.price) ? item.price : 0;
      return total + price * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        replaceCart,
        getTotalItems,
        getTotalPrice,
        getCartRestaurantId,
        clearAndAddToCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
