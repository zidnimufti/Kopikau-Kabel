import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

// =====================
// Users
// =====================
export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'barista';
}

// =====================
// Category & Product
// =====================
export interface Category {
  id: number;
  created_at?: string;
  name: string;
  description: string | null;
}

export interface Product {
  id: number;
  created_at?: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category_id: number;
  price_large?: number;
  size: "regular" | "large" | null;
}

// =====================
// Cart
// =====================
export interface CartItem {
  id: number;
  name: string;
  description: string | null;
  image_url: string | null;
  category_id: number;
  created_at?: string;
  price: number;
  price_large?: number;
  size: "regular" | "large";
  quantity: number;
}

// =====================
// Orders
// =====================

// buat tipe PaymentMethod supaya konsisten
export type PaymentMethod = "cash" | "qris";

export interface Order {
  id: number;
  created_at: string | null;   // <-- ubah dari string jadi string | null
  customer_name: string;
  total_amount: number;
  status: string;
  created_by?: string | null;
  payment_method: PaymentMethod | null;
  items: OrderItem[];
}


// Pending orders
export interface PendingOrderItem {
  product_id: number;
  quantity: number;
  subtotal: number;
  product?: Product;
}

export type PendingOrderWithItems = Order;


export interface OrderItem {
  product_id: number;
  quantity: number;
  size: "regular" | "large";
  subtotal: number;
  product?: Product; // ✅ join from DB
}

export interface DetailedOrderItem {
  product_name: string;
  quantity: number;
  size: "regular" | "large";
  subtotal: number;
}

export interface DetailedOrder {
  order_id: number;
  created_at: string;
  customer_name: string;
  total_amount: number;
  status: "pending" | "completed" | "cancelled"; // strict enum
  barista_name: string | null;  // Allow null for barista_name
  payment_method?: 'cash' | 'qris' | null;
  items: DetailedOrderItem[];
}
