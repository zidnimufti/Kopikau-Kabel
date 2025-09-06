// --- FILE: src/api/orderApi.ts ---
import { supabase } from './supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { Product, Category, CartItem, PendingOrderWithItems, PaymentMethod } from '../types';

// ---------------------------------------------
//  Helper & Types untuk normalisasi dari Supabase
// ---------------------------------------------
type RawOrderItem = {
  product_id: number;
  quantity: number;
  size: "regular" | "large";   // ✅ add here
  subtotal: number;
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

// Normalisasi 1 item
const normalizeItem = (it: RawOrderItem & { size?: "regular" | "large" }) => ({
  product_id: it.product_id,
  quantity: it.quantity,
  size: it.size, // 👈 do NOT force default, keep DB value
  subtotal: it.subtotal,
  product: Array.isArray(it.product) ? it.product[0] : it.product ?? undefined,
});




// Normalisasi 1 order
const normalizeOrder = (row: RawOrderRow): PendingOrderWithItems => ({
  id: row.id,
  customer_name: row.customer_name,
  total_amount: row.total_amount ?? (row.items?.reduce((s, it) => s + it.subtotal, 0) ?? 0),
  status: row.status,
  payment_method: row.payment_method ?? null, // null jika tidak ada
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
  const { data: products, error: productError } = await supabase.from('products').select('*');
  if (productError) throw productError;

  const { data: categories, error: categoryError } = await supabase.from('categories').select('*');
  if (categoryError) throw categoryError;

  return {
    products: (products ?? []) as Product[],
    categories: (categories ?? []) as Category[],
  };
};

// ---------------------------------------------
//  Pending orders (dengan items & product) — untuk Queue
// ---------------------------------------------
export const getPendingOrdersWithItems = async (): Promise<PendingOrderWithItems[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, customer_name, total_amount, status, payment_method, created_at, created_by,
      items:order_items (
        product_id, quantity, size, subtotal,
        product:products (*)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;

  const rows = ((data ?? []) as RawOrderRow[]).map(normalizeOrder);
  return rows;
  
};

// ---------------------------------------------
//  Ambil satu order untuk mode edit (items + product)
// ---------------------------------------------
export const getOrderWithItems = async (orderId: number): Promise<PendingOrderWithItems> => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, customer_name, total_amount, status, payment_method, created_at, created_by,
      items:order_items (
        product_id, quantity, size, subtotal,
        product:products (*)
      )
    `)
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

  const orderItemsData = cartItems.map((item) => ({
    order_id: orderData.id,
    product_id: item.id,
    quantity: item.quantity,
    size: item.size, // ✅ store size
    subtotal: item.price * item.quantity,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);
  if (itemsError) {
    await supabase.from('orders').delete().eq('id', orderData.id);
    throw itemsError;
  }

  return orderData;
};

// ---------------------------------------------
//  UPDATE status order
// ---------------------------------------------
export const updateOrderStatus = async (orderId: number, status: 'completed' | 'cancelled') => {
  const { data, error } = await supabase.from('orders').update({ status }).eq('id', orderId);
  if (error) throw error;
  return data;
};

// ---------------------------------------------
//  UPDATE order + items (mode edit)
// ---------------------------------------------
export const updateOrderAndItems = async (
  orderId: number,
  payload: {
    customer_name?: string;
    payment_method?: PaymentMethod;
    items: { product_id: number; quantity: number; size: "regular" | "large" }[]; // ✅ add size
  },
) => {
  const { error: upErr } = await supabase
    .from('orders')
    .update({
      ...(payload.customer_name ? { customer_name: payload.customer_name } : {}),
      ...(payload.payment_method ? { payment_method: payload.payment_method } : {}),
    })
    .eq('id', orderId);
  if (upErr) throw upErr;

  const { error: delErr } = await supabase.from('order_items').delete().eq('order_id', orderId);
  if (delErr) throw delErr;

  const productIds = [...new Set(payload.items.map((i) => i.product_id))];
  const { data: prodRows, error: pErr } = await supabase
    .from('products')
    .select('id, price, price_large')
    .in('id', productIds);
  if (pErr) throw pErr;

  const priceMap = new Map<number, { price: number; price_large?: number }>(
    (prodRows ?? []).map((p: any) => [p.id, { price: p.price, price_large: p.price_large }])
  );

  const itemsToInsert = payload.items.map((x) => {
    const productPrice = priceMap.get(x.product_id);
    const unitPrice =
      x.size === "large" && productPrice?.price_large
        ? productPrice.price_large
        : productPrice?.price ?? 0;

    return {
      order_id: orderId,
      product_id: x.product_id,
      quantity: x.quantity,
      size: x.size, // ✅ save size
      subtotal: unitPrice * x.quantity,
    };
  });

  const { error: insErr } = await supabase.from('order_items').insert(itemsToInsert);
  if (insErr) throw insErr;

  const newTotal = itemsToInsert.reduce((s, it) => s + (it.subtotal || 0), 0);
  const { error: totErr } = await supabase.from('orders').update({ total_amount: newTotal }).eq('id', orderId);
  if (totErr) throw totErr;

  return { id: orderId, total_amount: newTotal };
};

