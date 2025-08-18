import { SVGProps } from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'barista';
}

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
  image_url: string | null; // Mengganti 'image' menjadi 'image_url'
  category_id: number;
  // Properti seperti 'isNew', 'discount', 'discountedPrice' tidak ada di DB,
  // jadi kita hapus dari tipe dasar.
}


// Tipe untuk item di dalam keranjang belanja
export interface CartItem extends Product {
  quantity: number;
}

// Tipe untuk data order
export interface Order {
  id: number;
  created_at: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_by?: string | null;
  payment_method?: 'cash' | 'qris'; // NEW

}


