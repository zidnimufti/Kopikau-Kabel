import { useState, useEffect } from 'react';
import {
  uploadProductImage,
  getProductsWithCategories,
  addProduct,
  updateProduct,
  deleteProduct,
  getCategories,
} from '../../api/menuApi'; // Sesuaikan path
import { Product, Category } from '../../types'; // Sesuaikan path
import { Modal } from '../../components/ui/Modal'; // Sesuaikan path
import { ProductForm } from '../../features/admin/menu/ProductForm'; // Sesuaikan path

const MenuManagementPage = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, categoriesData] = await Promise.all([
        getProductsWithCategories(),
        getCategories(),
      ]);
      setProducts(productsData);
      setCategories(categoriesData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Anda yakin ingin menghapus produk ini?')) {
      try {
        await deleteProduct(id);
        loadData();
      } catch (err: any) {
        alert('Gagal menghapus produk: ' + err.message);
      }
    }
  };

  const handleFormSubmit = async (
    productData: Omit<Product, 'id' | 'created_at' | 'image_url'>,
    imageFile: File | null,
  ) => {
    setIsSubmitting(true);
    try {
      let imageUrl = editingProduct?.image_url || null;
      if (imageFile) {
        imageUrl = await uploadProductImage(imageFile);
      }
      const finalProductData = { ...productData, image_url: imageUrl };
      if (editingProduct) {
        await updateProduct(editingProduct.id, finalProductData);
      } else {
        await addProduct(finalProductData as any);
      }
      handleCloseModal();
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan produk: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-4 sm:p-6">Memuat menu...</div>;
  if (error) return <div className="p-4 sm:p-6 text-red-500">Error: {error}</div>;

  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Manajemen Menu</h1>
        <button
          onClick={handleOpenAddModal}
          className="self-start sm:self-auto bg-indigo-600 text-white px-4 py-2 rounded-md shadow-sm hover:bg-indigo-700"
        >
          + Tambah Produk
        </button>
      </div>

      {/* MOBILE: Card list (menghindari scroll horizontal) */}
      <div className="space-y-3 sm:hidden">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-white shadow rounded-lg p-4 flex gap-3 items-start"
          >
            <img
              src={
                product.image_url ||
                'https://placehold.co/100x100/e2e8f0/e2e8f0?text=No-Image'
              }
              alt={product.name}
              className="w-16 h-16 object-cover rounded-md flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {product.name}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                  {product.categories?.name || 'Uncategorized'}
                </span>
                <span className="text-sm text-gray-600">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                  }).format(product.price)}
                </span>
              </div>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={() => handleOpenEditModal(product)}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Belum ada produk.
          </div>
        )}
      </div>

      {/* DESKTOP/TABLET: Tabel responsif */}
      <div className="hidden sm:block bg-white shadow-md rounded-lg">
        <div className="overflow-x-auto">
          {/* min-w memastikan kolom tidak “pecah” & bisa di-scroll bila sempit */}
          <table className="min-w-[720px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Gambar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Kategori
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Harga
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {products.map((product) => (
                <tr key={product.id} className="align-top">
                  <td className="px-6 py-4">
                    <img
                      src={
                        product.image_url ||
                        'https://placehold.co/100x100/e2e8f0/e2e8f0?text=No-Image'
                      }
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-md"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      {product.categories?.name || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {new Intl.NumberFormat('id-ID', {
                      style: 'currency',
                      currency: 'IDR',
                    }).format(product.price)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => handleOpenEditModal(product)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Belum ada produk.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal tambah/edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
      >
        <ProductForm
          onSubmit={handleFormSubmit}
          onCancel={handleCloseModal}
          initialData={editingProduct}
          categories={categories}
          isSubmitting={isSubmitting}
        />
      </Modal>
    </div>
  );
};

export default MenuManagementPage;
