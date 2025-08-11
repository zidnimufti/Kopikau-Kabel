import { useState, useEffect, FormEvent, ChangeEvent } from 'react';
import { Product, Category } from '../../../types'; // Sesuaikan path jika perlu

interface ProductFormProps {
  // Mengubah onSubmit untuk mengirimkan file gambar secara terpisah
  onSubmit: (product: Omit<Product, 'id' | 'created_at' | 'image_url'>, imageFile: File | null) => void;
  onCancel: () => void;
  initialData?: Product | null;
  categories: Category[];
  isSubmitting: boolean;
}

export const ProductForm = ({ onSubmit, onCancel, initialData, categories, isSubmitting }: ProductFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(0);
  const [categoryId, setCategoryId] = useState<number | ''>('');
  
  // State baru untuk file gambar dan pratinjau
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setDescription(initialData.description || '');
      setPrice(initialData.price);
      setCategoryId(initialData.category_id);
      setImagePreview(initialData.image_url || null); // Tampilkan gambar yang sudah ada
    } else {
      // Reset form
      setName('');
      setDescription('');
      setPrice(0);
      setCategoryId('');
      setImagePreview(null);
      setImageFile(null);
    }
  }, [initialData]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Buat URL sementara untuk pratinjau
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (categoryId === '') return;
    onSubmit({ name, description, price, category_id: categoryId }, imageFile);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="space-y-4">
        {/* Pratinjau Gambar */}
        {imagePreview && (
            <div className="w-full h-48 bg-gray-100 rounded-md flex items-center justify-center">
                <img src={imagePreview} alt="Pratinjau Produk" className="max-h-full max-w-full object-contain rounded-md" />
            </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700">Gambar Produk</label>
          <input type="file" onChange={handleImageChange} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
        </div>
        {/* ... input lainnya (Nama, Deskripsi, Harga, Kategori) tetap sama ... */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Nama</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Deskripsi</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Harga</label>
          <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Kategori</label>
          <select value={categoryId} onChange={e => setCategoryId(Number(e.target.value))} required className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
            <option value="" disabled>Pilih kategori</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300">Batal</button>
        <button type="submit" disabled={isSubmitting} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300">
          {isSubmitting ? 'Menyimpan...' : 'Simpan Produk'}
        </button>
      </div>
    </form>
  );
};