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
