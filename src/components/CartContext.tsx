// --- FILE: src/components/CartContext.tsx (UPDATED) ---
// Deskripsi: Memperbaiki bug dengan menghapus panggilan parseRupiah yang tidak perlu.

import React, { createContext, useContext, useState } from "react";
import { Product } from "../types/";
// Kita tidak lagi memerlukan parseRupiah di sini
// import { parseRupiah } from "@/components/rupiah";


// Define cart item type (product + quantity)
export interface CartItem {
  product: Product;
  size: "regular" | "large";
  quantity: number;
}

// Define payment method type
export type PaymentMethod = "cash" | "qris" | null;

// Define cart context type
interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, size: "regular" | "large", quantity?: number) => void; // ✅ update
  removeFromCart: (productId: number, size: "regular" | "large") => void; // ✅ per item + size
  updateQuantity: (productId: number, size: "regular" | "large", quantity: number) => void; // ✅ update
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
}


// Create context with default values
const CartContext = createContext<CartContextType>({
  cartItems: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  totalItems: 0,
  totalPrice: 0,
  paymentMethod: null,
  setPaymentMethod: () => {},
});

// Custom hook to use cart context
export const useCart = () => useContext(CartContext);

// Cart provider component
export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  // Add product to cart
  const addToCart = (
  product: Product,
  size: "regular" | "large",
  quantity: number = 1
) => {
  setCartItems((prevItems) => {
    const existingItem = prevItems.find(
      (item) => item.product.id === product.id && item.size === size
    );

    if (existingItem) {
      // kalau sudah ada, update quantity
      return prevItems.map((item) =>
        item.product.id === product.id && item.size === size
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
    } else {
      // ✅ pastikan return sesuai CartItem
      return [...prevItems, { product, size, quantity }];
    }
  });
};


  // Remove product from cart
  const removeFromCart = (productId: number, size: "regular" | "large") => {
  setCartItems((prevItems) =>
    prevItems.filter((item) => !(item.product.id === productId && item.size === size))
  );
};


  // Update quantity of a product
  const updateQuantity = (
  productId: number,
  size: "regular" | "large",
  quantity: number
) => {
  if (quantity <= 0) {
    setCartItems((prev) =>
      prev.filter((item) => !(item.product.id === productId && item.size === size))
    );
    return;
  }

  setCartItems((prev) =>
    prev.map((item) =>
      item.product.id === productId && item.size === size
        ? { ...item, quantity }
        : item
    )
  );
};


  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    setPaymentMethod(null);
  };

  // Calculate total items in cart
  const totalItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Calculate total price
  // FIX: Hapus panggilan ke parseRupiah. Gunakan item.product.price secara langsung.
  const totalPrice = cartItems.reduce((total, item) => {
  const price =
    item.size === "large" && item.product.price_large
      ? item.product.price_large
      : item.product.price;
  return total + price * item.quantity;
}, 0);


  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    paymentMethod,
    setPaymentMethod,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
