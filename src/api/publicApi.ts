import { supabase } from './supabaseClient'; // Sesuaikan path jika perlu

export const getPublicProducts = async () => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false }); // Tampilkan produk terbaru dulu

    if (error) {
        console.error("Error fetching public products:", error);
        throw error;
    }

    return data;
};
