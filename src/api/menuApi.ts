import { supabase } from './supabaseClient'; // Sesuaikan path jika perlu
import { Product } from '../types'; // Sesuaikan path jika perlu

// Fungsi baru untuk mengunggah gambar produk
export const uploadProductImage = async (file: File) => {
    // Buat nama file yang unik untuk menghindari konflik
    const filePath = `public/${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
        .from('product-images') // Nama bucket yang kita buat
        .upload(filePath, file);

    if (uploadError) {
        throw uploadError;
    }

    // Ambil URL publik dari file yang baru diunggah
    const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

    return data.publicUrl;
};


// ... (Fungsi-fungsi lain seperti getProductsWithCategories, getCategories, dll. tetap ada) ...

export const getProductsWithCategories = async (): Promise<any[]> => {
  const { data, error } = await supabase
    .from('products')
    .select(`*, categories ( name )`);
  if (error) throw new Error(error.message);
  return data || [];
};

export const getCategories = async () => {
  const { data, error } = await supabase.from('categories').select('*');
  if (error) throw new Error(error.message);
  return data || [];
};

export const addProduct = async (productData: Omit<Product, 'id' | 'created_at'>) => {
  const { data, error } = await supabase.from('products').insert([productData]).select();
  if (error) throw new Error(error.message);
  return data;
};

export const updateProduct = async (id: number, productData: Partial<Omit<Product, 'id' | 'created_at'>>) => {
  const { data, error } = await supabase.from('products').update(productData).eq('id', id).select();
  if (error) throw new Error(error.message);
  return data;
};

export const deleteProduct = async (id: number) => {
  const { data, error } = await supabase.from('products').delete().eq('id', id);
  if (error) throw new Error(error.message);
  return data;
};
