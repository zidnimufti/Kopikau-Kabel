import { supabase } from './supabaseClient';
import { CartItem } from '../types';
import { User } from '@supabase/supabase-js';

// Mengambil semua produk dan kategori yang aktif untuk ditampilkan di menu
export const getActiveMenu = async () => {
  const { data: products, error: productError } = await supabase.from('products').select('*');
  if (productError) throw productError;

  const { data: categories, error: categoryError } = await supabase.from('categories').select('*');
  if (categoryError) throw categoryError;

  return { products, categories };
};

// Mengambil semua order yang masih dalam status 'pending'
export const getPendingOrders = async () => {
    const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
};

// Proses utama untuk membuat order baru
export const createOrder = async (cartItems: CartItem[], customerName: string, totalAmount: number, user: User) => {
    // Langkah 1: Buat record di tabel 'orders'
    const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
            customer_name: customerName,
            total_amount: totalAmount,
            created_by: user.id,
            status: 'pending'
        })
        .select()
        .single();

    if (orderError) throw orderError;
    if (!orderData) throw new Error("Failed to create order.");

    // Langkah 2: Siapkan item-item untuk tabel 'order_items'
    const orderItemsData = cartItems.map(item => ({
        order_id: orderData.id,
        product_id: item.id,
        quantity: item.quantity,
        subtotal: item.price * item.quantity
    }));

    // Langkah 3: Masukkan semua item ke 'order_items'
    const { error: itemsError } = await supabase.from('order_items').insert(orderItemsData);

    if (itemsError) {
        // Jika gagal memasukkan item, coba hapus order yang sudah terbuat untuk konsistensi
        console.error("Error inserting order items, rolling back order...");
        await supabase.from('orders').delete().eq('id', orderData.id);
        throw itemsError;
    }

    return orderData;
};

// Memperbarui status order (misal: dari 'pending' ke 'completed')
// FIX: Menambahkan 'export' agar bisa diimpor di file lain.
export const updateOrderStatus = async (orderId: number, status: 'completed' | 'cancelled') => {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
    
    if (error) throw error;
    return data;
};

// ====== TYPE bantu (opsional) ======
export type UpdateOrderPayload = {
  customer_name: string;
  items: { product_id: number; quantity: number }[];
};

// ====== Ambil 1 order + item2 + detail produk ======
export const getOrderWithItems = async (orderId: number) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      customer_name,
      total_amount,
      status,
      created_at,
      order_items:order_items (
        product_id,
        quantity,
        subtotal,
        products:products (
          id, name, price, image_url, category_id
        )
      )
    `)
    .eq('id', orderId)
    .single();

  if (error) throw error;

  // Rapikan struktur items
  const items =
    (data as any)?.order_items?.map((it: any) => ({
      product_id: it.product_id,
      quantity: it.quantity,
      subtotal: it.subtotal,
      product: it.products, // { id, name, price, image_url, category_id }
    })) ?? [];

  return {
    id: (data as any).id,
    customer_name: (data as any).customer_name,
    total_amount: (data as any).total_amount,
    status: (data as any).status,
    created_at: (data as any).created_at,
    items,
  };
};

// ====== Update order + ganti semua item ======
// Langkah: ambil harga produk -> hitung subtotal & total -> hapus item lama -> insert item baru -> update orders
export const updateOrderAndItems = async (
  orderId: number,
  payload: UpdateOrderPayload
) => {
  // 1) Ambil harga produk yang dipakai
  const productIds = Array.from(new Set(payload.items.map((i) => i.product_id)));
  const { data: productsPrice, error: priceErr } = await supabase
    .from('products')
    .select('id, price')
    .in('id', productIds);

  if (priceErr) throw priceErr;

  const priceMap = new Map<number, number>();
  (productsPrice ?? []).forEach((p: any) => priceMap.set(p.id, p.price));

  // 2) Siapkan rows order_items baru + hitung total
  const itemsRows = payload.items.map((it) => {
    const price = priceMap.get(it.product_id) ?? 0;
    return {
      order_id: orderId,
      product_id: it.product_id,
      quantity: it.quantity,
      subtotal: price * it.quantity,
    };
  });
  const totalAmount = itemsRows.reduce((s, r) => s + (r.subtotal ?? 0), 0);

  // 3) Hapus semua item lama
  const { error: delErr } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);
  if (delErr) throw delErr;

  // 4) Insert item baru (jika ada)
  if (itemsRows.length > 0) {
    const { error: insErr } = await supabase
      .from('order_items')
      .insert(itemsRows);
    if (insErr) throw insErr;
  }

  // 5) Update data order (nama & total)
  const { error: updErr } = await supabase
    .from('orders')
    .update({
      customer_name: payload.customer_name,
      total_amount: totalAmount,
    })
    .eq('id', orderId);

  if (updErr) throw updErr;

  return { id: orderId, total_amount: totalAmount };
};

// Ambil pending orders beserta item & produk
export const getPendingOrdersWithItems = async () => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      id, customer_name, total_amount, status, created_at,
      order_items:order_items (
        product_id,
        quantity,
        subtotal,
        products:products ( id, name, price, image_url, category_id )
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;

  // rapikan struktur items
  return (data ?? []).map((row: any) => ({
    ...row,
    items: (row.order_items ?? []).map((it: any) => ({
      product_id: it.product_id,
      quantity: it.quantity,
      product: it.products,
    })),
  }));
};
