import { supabase } from '../api/supabaseClient'; // Asumsi path sudah diperbarui

// Mengambil data ringkasan untuk dashboard
export const getDashboardSummary = async () => {
    const { data: totalRevenue, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

    if (revenueError) throw revenueError;

    const { count: totalOrders, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact' });
    
    if (ordersError) throw ordersError;

    const revenue = totalRevenue.reduce((sum, order) => sum + order.total_amount, 0);

    // FIX: Pastikan totalOrders selalu number, default ke 0 jika null.
    return { revenue, totalOrders: totalOrders ?? 0 };
};

// Mengambil daftar semua barista beserta total penjualan mereka
export const getBaristas = async () => {
    // Ganti .from('users').select() dengan .rpc('get_all_baristas')
    const { data, error } = await supabase.rpc('get_all_baristas');

    if (error) {
        console.error("Gagal mengambil daftar barista:", error);
        throw error;
    }
    return data;
};

export const getBaristaDetails = async (id: string) => {
    const { data, error } = await supabase
        .rpc('get_barista_details_by_id', { p_barista_id: id })
        .single();
    if (error) throw error;
    return data;
};


// Fungsi baru untuk memanggil RPC laporan detail
export const getBaristaSalesDetails = async (baristaId: string, startDate: string, endDate: string) => {
    const { data, error } = await supabase.rpc('get_sales_details_for_barista', {
        p_barista_id: baristaId,
        p_start_date: startDate,
        p_end_date: endDate
    });
    if (error) throw error;
    return data;
};

export const getAllOrders = async () => {
    const { data, error } = await supabase.rpc('get_all_orders_with_details');
    if (error) {
        console.error("Error fetching all orders:", error);
        throw error;
    }
    return data;
};
