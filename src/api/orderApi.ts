// --- FILE: src/api/orderApi.ts ---
import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Product, Category, CartItem } from '../types';

export type PaymentMethod = 'cash' | 'qris';

// ---------------------------------------------
//  Helper & Types untuk normalisasi dari Supabase
// ---------------------------------------------
type RawOrderItem = {
  product_id: number;
  quantity: number;
  subtotal: number;
  // Supabase bisa balikin object, array, atau null tergantung tipe/generator
  product: Product | Product[] | null;
};

type RawOrderRow = {
  id: number;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method: 'cash' | 'qris' | null;
  created_at: string;
  created_by?: string | null;
  items?: RawOrderItem[] | null;
};

// Bentuk hasil API yang konsisten untuk BaristaPage
export interface PendingOrderWithItems {
  id: number;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  payment_method?: PaymentMethod;
  created_at: string;
  created_by: string | null;
  items: {
    product_id: number;
    quantity: number;
    subtotal: number;
    product?: Product;
  }[];
}

// Normalisasi 1 item
const normalizeItem = (it: RawOrderItem) => ({
  product_id: it.product_id,
  quantity: it.quantity,
  subtotal: it.subtotal,
  product: Array.isArray(it.product)
    ? (it.product[0] as Product | undefined)
    : (it.product as Product | undefined),
});

// Normalisasi 1 order
const normalizeOrder = (row: RawOrderRow): PendingOrderWithItems => ({
  id: row.id,
  customer_name: row.customer_name,
  total_amount: row.total_amount,
  status: row.status,
  payment_method: (row.payment_method ?? undefined) as PaymentMethod | undefined,
  created_at: row.created_at,
  created_by: row.created_by ?? null,
  items: (row.items ?? []).map(normalizeItem),
});

// ---------------------------------------------
//  Menu (products + categories)
// ---------------------------------------------
export const getActiveMenu = async (): Promise<{
  products: Product[];
  categories: Category[];
}> => {
  const { data: products, error: productError } = await supabase
    .from('products')
    .select('*');
  if (productError) throw productError;

  const { data: categories, error: categoryError } = await supabase
    .from('categories')
    .select('*');
  if (categoryError) throw categoryError;

  return {
    products: (products ?? []) as Product[],
    categories: (categories ?? []) as Category[],
  };
};

// ---------------------------------------------
//  Pending orders (dengan items & product) — untuk Queue
// ---------------------------------------------
export const getPendingOrdersWithItems = async (): Promise<
  PendingOrderWithItems[]
> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id, customer_name, total_amount, status, payment_method, created_at, created_by,
      items:order_items (
        product_id, quantity, subtotal,
        product:products (*)
      )
    `,
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const rows = ((data ?? []) as RawOrderRow[]).map(normalizeOrder);
  return rows;
};

// ---------------------------------------------
//  Ambil satu order untuk mode edit (items + product)
// ---------------------------------------------
export const getOrderWithItems = async (
  orderId: number,
): Promise<PendingOrderWithItems> => {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      id, customer_name, total_amount, status, payment_method, created_at, created_by,
      items:order_items (
        product_id, quantity, subtotal,
        product:products (*)
      )
    `,
    )
    .eq('id', orderId)
    .single();

  if (error) throw error;
  return normalizeOrder(data as RawOrderRow);
};

// ---------------------------------------------
//  CREATE order baru (+ order_items) — wajib payment_method
// ---------------------------------------------
export const createOrder = async (
  cartItems: CartItem[],
  customerName: string,
  totalAmount: number,
  user: User,
  paymentMethod: PaymentMethod,
) => {
  // 1) insert orders
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_name: customerName,
      total_amount: totalAmount,
      created_by: user.id,
      status: 'pending',
      payment_method: paymentMethod,
    })
    .select()
    .single();

  if (orderError) throw orderError;
  if (!orderData) throw new Error('Failed to create order.');

  // 2) insert order_items
  const orderItemsData = cartItems.map((item) => ({
    order_id: orderData.id,
    product_id: item.id,
    quantity: item.quantity,
    subtotal: item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsData);
  if (itemsError) {
    // rollback jika gagal insert items
    await supabase.from('orders').delete().eq('id', orderData.id);
    throw itemsError;
  }

  return orderData;
};

// ---------------------------------------------
//  UPDATE status order
// ---------------------------------------------
export const updateOrderStatus = async (
  orderId: number,
  status: 'completed' | 'cancelled',
) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
  return data;
};

// ---------------------------------------------
//  UPDATE order + items (mode edit)
//  - Update customer_name & payment_method (jika ada)
//  - Replace semua order_items
//  - Hitung ulang subtotal & total_amount dari harga produk terbaru
// ---------------------------------------------
export const updateOrderAndItems = async (
  orderId: number,
  payload: {
    customer_name?: string;
    payment_method?: PaymentMethod;
    items: { product_id: number; quantity: number }[];
  },
) => {
  // 1) update header (optional fields)
  const { error: upErr } = await supabase
    .from('orders')
    .update({
      ...(payload.customer_name ? { customer_name: payload.customer_name } : {}),
      ...(payload.payment_method ? { payment_method: payload.payment_method } : {}),
    })
    .eq('id', orderId);
  if (upErr) throw upErr;

  // 2) hapus items lama
  const { error: delErr } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);
  if (delErr) throw delErr;

  // 3) ambil harga produk yang diperlukan
  const productIds = [...new Set(payload.items.map((i) => i.product_id))];
  const { data: prodRows, error: pErr } = await supabase
    .from('products')
    .select('id, price')
    .in('id', productIds);
  if (pErr) throw pErr;

  const priceMap = new Map<number, number>(
    (prodRows ?? []).map((p: any) => [p.id as number, p.price as number]),
  );

  // 4) siapkan items baru + subtotal
  const itemsToInsert = payload.items.map((x) => ({
    order_id: orderId,
    product_id: x.product_id,
    quantity: x.quantity,
    subtotal: (priceMap.get(x.product_id) || 0) * x.quantity,
  }));

  const { error: insErr } = await supabase
    .from('order_items')
    .insert(itemsToInsert);
  if (insErr) throw insErr;

  // 5) update total_amount
  const newTotal = itemsToInsert.reduce((s, it) => s + (it.subtotal || 0), 0);
  const { error: totErr } = await supabase
    .from('orders')
    .update({ total_amount: newTotal })
    .eq('id', orderId);
  if (totErr) throw totErr;

  return { id: orderId, total_amount: newTotal };
};
