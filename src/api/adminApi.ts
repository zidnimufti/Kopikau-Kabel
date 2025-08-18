// src/api/adminApi.ts
import { supabase } from '../api/supabaseClient';

/** ===== Types shared with UI ===== */
export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'qris' | null;

export interface DetailedOrder {
  order_id: number;
  created_at: string;
  customer_name: string;
  total_amount: number;
  status: OrderStatus;
  barista_name: string;
  payment_method?: 'cash' | 'qris' | null;
  items: { product_name: string; quantity: number; subtotal: number }[];
}

/** Dashboard summary (revenue dari completed + total orders apapun statusnya) */
export const getDashboardSummary = async (): Promise<{
  revenue: number;
  totalOrders: number;
}> => {
  // Ambil semua total_amount dari order completed
  const { data: totalRevenue, error: revenueError } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('status', 'completed');

  if (revenueError) throw revenueError;

  // Hitung jumlah seluruh order (semua status)
  const { count: totalOrders, error: ordersError } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true });

  if (ordersError) throw ordersError;

  const revenue = (totalRevenue ?? []).reduce(
    (sum: number, row: any) => sum + (row?.total_amount ?? 0),
    0
  );

  return { revenue, totalOrders: totalOrders ?? 0 };
};

/** Daftar barista (via RPC get_all_baristas, fallback ke profiles bila RPC belum ada) */
export const getBaristas = async () => {
  // Coba RPC dahulu
  const { data, error } = await supabase.rpc('get_all_baristas');

  if (!error && data) return data;

  // Fallback sederhana (silakan sesuaikan kolomnya)
  const { data: fallback, error: fbErr } = await supabase
    .from('profiles')
    .select('id, full_name')
    .order('full_name', { ascending: true });

  if (fbErr) throw fbErr;
  return fallback;
};

/** Detail 1 barista (via RPC) */
export const getBaristaDetails = async (id: string) => {
  const { data, error } = await supabase
    .rpc('get_barista_details_by_id', { p_barista_id: id })
    .single();
  if (error) throw error;
  return data;
};

/** Laporan detail penjualan barista pada rentang tanggal (via RPC) */
export const getBaristaSalesDetails = async (
  baristaId: string,
  startDate: string,
  endDate: string
) => {
  const { data, error } = await supabase.rpc('get_sales_details_for_barista', {
    p_barista_id: baristaId,
    p_start_date: startDate,
    p_end_date: endDate,
  });
  if (error) throw error;
  return data;
};

/**
 * Semua order lengkap (tanpa RPC):
 * - join ke profiles untuk ambil nama barista (alias "barista")
 * - join ke order_items → products untuk item detail
 * - sertakan payment_method
 *
 * NOTE: Jika nama FK orders.created_by → profiles.id berbeda,
 * ganti 'orders_created_by_fkey' sesuai yang ada di Supabase.
 */
export const getAllOrders = async (): Promise<DetailedOrder[]> => {
  const { data, error } = await supabase.rpc('get_all_orders_with_details');
  if (error) {
    // Jika gagal karena alias FK, beri pesan yang memudahkan debugging
    console.error(
      'getAllOrders select error. Cek nama FK join ke profiles (orders_created_by_fkey).',
      error
    );
    throw error;
  }
    
  return (data ?? []).map((row: any) => ({
    order_id: row.order_id,
    created_at: row.created_at,
    customer_name: row.customer_name,
    total_amount: Number(row.total_amount) || 0,
    status: row.status,
    barista_name: row.barista_name ?? '—', // jika full_name kosong, tampilkan strip
    payment_method: row.payment_method as 'cash' | 'qris' | null,
    items: Array.isArray(row.items)
      ? row.items.map((it: any) => ({
          product_name: it.product_name,
          quantity: Number(it.quantity) || 0,
          subtotal: Number(it.subtotal) || 0,
        }))
      : [],
  }));
};

/**
 * Hapus order (aman): hapus item dulu baru parent.
 * Jika FK di DB sudah ON DELETE CASCADE, penghapusan order_items bisa dilewati,
 * tapi kode ini tetap aman untuk dua-duanya.
 */
export const deleteOrder = async (orderId: number): Promise<boolean> => {
  // Hapus dulu semua order_items yang terkait
  const { error: itemsErr } = await supabase
    .from('order_items')
    .delete()
    .eq('order_id', orderId);
  if (itemsErr) throw itemsErr;

  // Hapus parent order
  const { error: orderErr } = await supabase.from('orders').delete().eq('id', orderId);
  if (orderErr) throw orderErr;

  return true;
};
