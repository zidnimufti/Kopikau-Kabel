// src/api/adminApi.ts
import {  DetailedOrder } from '@/types';
import { supabase } from '../api/supabaseClient';

/** ===== Types shared with UI ===== */
export type OrderStatus = 'pending' | 'completed' | 'cancelled';
export type PaymentMethod = 'cash' | 'qris' | null;


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
    .from('users')
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
  try {
    // First try using the RPC function if available
    const { data, error } = await supabase.rpc("get_all_orders_with_details");
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      order_id: row.order_id,
      created_at: row.created_at,
      customer_name: row.customer_name,
      total_amount: Number(row.total_amount) || 0,
      status: row.status,
      barista_name: row.barista_name || '—', // Use fallback if null
      payment_method: row.payment_method as "cash" | "qris" | null,
      items: Array.isArray(row.items)
        ? row.items.map((it: any) => ({
            product_name: it.product_name,
            quantity: Number(it.quantity) || 0,
            size: (it.size as "regular" | "large" | null) ?? "regular", // Default to regular if null
            subtotal: Number(it.subtotal) || 0,
          }))
        : [],
    }));
  } catch (rpcError) {
    console.error("Error getting orders with RPC, falling back to manual query:", rpcError);
    
    // FALLBACK: Manual query with join to get the data directly
    try {
      // First get all orders
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (ordersError) throw ordersError;
      
      // Process orders
      const result: DetailedOrder[] = [];
      
      for (const order of orders || []) {
        // For each order, get its items
        const { data: items, error: itemsError } = await supabase
          .from('order_items')
          .select('*, products(name)')
          .eq('order_id', order.id);
          
        if (itemsError) console.error("Error fetching items for order", order.id, itemsError);
        
        // Always use dash as fallback for barista name since we can't access auth.users
        let baristaName = '—';
        
        // Map the items
        const mappedItems = (items || []).map((item: any) => ({
          product_name: item.products?.name || `Product #${item.product_id}`,
          quantity: Number(item.quantity) || 0,
          size: (item.size as "regular" | "large") || "regular",
          subtotal: Number(item.subtotal) || 0
        }));
        
        // Add this order to results
        result.push({
          order_id: order.id,
          created_at: order.created_at,
          customer_name: order.customer_name,
          total_amount: Number(order.total_amount) || 0,
          status: order.status,
          barista_name: baristaName,
          payment_method: order.payment_method as "cash" | "qris" | null,
          items: mappedItems
        });
      }
      
      return result;
    } catch (fallbackError) {
      console.error("Fallback query also failed:", fallbackError);
      throw fallbackError;
    }
  }
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
