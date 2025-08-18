// --- FILE: src/pages/barista/BaristaPage.tsx ---
// QUEUE TANPA ORDER ID, TANPA HAPUS + METODE PEMBAYARAN
// + Sidebar ringkasan penjualan barista HARI INI (completed only) + realtime refresh
// + FIX mobile sheet: h-[85dvh] + list scrollable

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Category, Product, CartItem, Order } from '../../types';
import {
  getActiveMenu,
  createOrder,
  getPendingOrdersWithItems,
  updateOrderStatus,
  getOrderWithItems,
  updateOrderAndItems,
} from '../../api/orderApi';
import { useAuth } from '../../auth/hooks/useAuth';
import { useProfile } from '../../auth/hooks/useProfile';
import { supabase } from '../../api/supabaseClient';
import { Link } from '@heroui/link';

type PaymentMethod = 'cash' | 'qris';

// Helper format rupiah
const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);

// ===== Ikon kecil
const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09c-1.18 0-2.09.954-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0"
    />
  </svg>
);

// ===== Cart (dipakai desktop & mobile sheet)
interface OrderCartProps {
  cart: CartItem[];
  customerName: string;
  paymentMethod: '' | PaymentMethod;
  isSubmitting: boolean;
  onCustomerNameChange: (name: string) => void;
  onPaymentMethodChange: (pm: PaymentMethod) => void;
  onUpdateQuantity: (productId: number, newQuantity: number) => void;
  onRemoveItem: (productId: number) => void;
  onSubmit: () => void;
  onClose?: () => void;
  showClose?: boolean;
  isEditing?: boolean;
  onCancelEdit?: () => void;
}
const OrderCart = ({
  cart,
  customerName,
  paymentMethod,
  isSubmitting,
  onCustomerNameChange,
  onPaymentMethodChange,
  onUpdateQuantity,
  onRemoveItem,
  onSubmit,
  onClose,
  showClose,
  isEditing,
  onCancelEdit,
}: OrderCartProps) => {
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const placeDisabled = cart.length === 0 || !customerName || !paymentMethod || isSubmitting;

  return (
    <div className="bg-white h-full flex flex-col p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">{isEditing ? 'Edit Order' : 'Current Order'}</h2>
        <div className="flex items-center gap-2">
          {isEditing && onCancelEdit ? (
            <button onClick={onCancelEdit} className="text-sm px-3 py-1 rounded bg-gray-100">
              Batalkan Edit
            </button>
          ) : null}
          {showClose ? (
            <button onClick={onClose} className="md:hidden text-sm px-3 py-1 rounded bg-gray-100">
              Tutup
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Customer Name</label>
        <input
          type="text"
          value={customerName}
          onChange={(e) => onCustomerNameChange(e.target.value)}
          placeholder="e.g., John Doe"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500"
        />
      </div>

      {/* Metode Pembayaran */}
      <div className="mt-4">
        <label className="block text-sm font-medium text-gray-700">Metode Pembayaran</label>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onPaymentMethodChange('cash')}
            className={`px-3 py-2 rounded-md border ${
              paymentMethod === 'cash' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'
            }`}
          >
            Cash
          </button>
          <button
            type="button"
            onClick={() => onPaymentMethodChange('qris')}
            className={`px-3 py-2 rounded-md border ${
              paymentMethod === 'qris' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white'
            }`}
          >
            QRIS
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-500">Wajib pilih salah satu.</p>
      </div>

      {/* AREA LIST YANG SCROLLABLE */}
      <div
        className="flex-grow overflow-y-auto mt-4 touch-pan-y"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {cart.length === 0 ? (
          <p className="text-gray-500">Cart is empty.</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {cart.map((item) => (
              <li key={item.id} className="py-3 flex flex-col">
                <div className="flex justify-between items-center gap-3">
                  <p className="font-medium break-words">{item.name}</p>
                  <p className="font-semibold">
                    {new Intl.NumberFormat('id-ID').format(item.price * item.quantity)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm text-gray-500">
                    {new Intl.NumberFormat('id-ID').format(item.price)} x {item.quantity}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                    <button onClick={() => onRemoveItem(item.id)} className="text-red-500 hover:text-red-700 ml-2">
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t pt-4">
        <div className="flex justify-between items-center font-bold text-lg mb-4">
          <span>Total</span>
          <span>{fmtIDR(total)}</span>
        </div>
        <button
          onClick={onSubmit}
          disabled={placeDisabled}
          className="w-full bg-green-600 text-white py-3 rounded-md text-lg font-bold hover:bg-green-700 disabled:bg-gray-400"
        >
          {isEditing ? (isSubmitting ? 'Updating...' : 'Update Order') : isSubmitting ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
};

// ===== Pending Orders (tampilkan item; TANPA Order ID & TANPA tombol Hapus)
type PendingOrderWithItems = Order & {
  payment_method?: PaymentMethod;
  items?: { product_id: number; quantity: number; product?: Product }[];
};

const PendingOrdersList = ({
  orders,
  onUpdateStatus,
  onEdit,
}: {
  orders: PendingOrderWithItems[];
  onUpdateStatus: (orderId: number, status: 'completed' | 'cancelled') => void;
  onEdit: (orderId: number) => void;
}) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {orders.map((order) => (
      <div key={order.id} className="bg-yellow-100 p-3 rounded-md shadow flex flex-col">
        <div>
          <p className="font-bold text-lg break-words">{order.customer_name}</p>
          {order.payment_method && (
            <p className="text-xs text-gray-600 mt-1">Metode: {order.payment_method.toUpperCase()}</p>
          )}
        </div>

        <ul className="mt-3 text-sm text-gray-800 space-y-1">
          {(order.items ?? []).map((it) => (
            <li key={`${order.id}-${it.product_id}`} className="flex justify-between">
              <span className="truncate">{it.product?.name ?? 'Item'}</span>
              <span className="ml-2 font-medium">x{it.quantity}</span>
            </li>
          ))}
          {(!order.items || order.items.length === 0) && <li className="text-gray-500">Belum ada item.</li>}
        </ul>

        <div className="flex gap-2 mt-3">
          <button onClick={() => onEdit(order.id)} className="flex-1 bg-blue-500 text-white text-xs py-1 rounded hover:bg-blue-600">
            Edit
          </button>
          <button
            onClick={() => onUpdateStatus(order.id, 'completed')}
            className="flex-1 bg-green-500 text-white text-xs py-1 rounded hover:bg-green-600"
          >
            Selesai
          </button>
          <button
            onClick={() => onUpdateStatus(order.id, 'cancelled')}
            className="flex-1 bg-red-500 text-white text-xs py-1 rounded hover:bg-red-600"
          >
            Batal
          </button>
        </div>
      </div>
    ))}
  </div>
);

// ===== Halaman Utama
const BaristaPage = () => {
  const { user, logout } = useAuth();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'' | PaymentMethod>(''); // NEW
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingOrders, setPendingOrders] = useState<PendingOrderWithItems[]>([]);

  // Ringkasan penjualan HARI INI (completed saja) untuk barista login
  const [todaySummary, setTodaySummary] = useState({ total: 0, count: 0, cash: 0, qris: 0 });

  // UI
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);

  // mode edit
  const [editingOrderId, setEditingOrderId] = useState<number | null>(null);

  // realtime
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchPending = useCallback(async () => {
    const data = await getPendingOrdersWithItems();
    setPendingOrders(data ?? []);
  }, []);

  const fetchTodaySummary = useCallback(async () => {
    if (!user?.id) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const { data, error } = await supabase
      .from('orders')
      .select('total_amount,payment_method,created_at')
      .eq('created_by', user.id) // barista sekarang
      .eq('status', 'completed')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    if (error) {
      console.error('Gagal ambil ringkasan hari ini:', error);
      return;
    }

    let total = 0,
      count = 0,
      cash = 0,
      qris = 0;
    (data ?? []).forEach((r: any) => {
      const v = Number(r.total_amount) || 0;
      total += v;
      count++;
      if (r.payment_method === 'cash') cash += v;
      else if (r.payment_method === 'qris') qris += v;
    });
    setTodaySummary({ total, count, cash, qris });
  }, [user?.id]);

  useEffect(() => {
    getActiveMenu().then(({ products, categories }) => {
      setProducts(products);
      setCategories(categories);
      if (categories.length > 0) setActiveCategory(categories[0].id);
    });

    const ch = supabase.channel('orders-channel', { config: { broadcast: { self: true } } });
    channelRef.current = ch;

    ch.on('broadcast', { event: 'orders_updated' }, () => {
      fetchPending();
      fetchTodaySummary();
    });

    ch.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        fetchPending();
        fetchTodaySummary();
      }
    });

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchPending, fetchTodaySummary]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sendOrdersUpdated = useCallback(async (meta?: Record<string, unknown>) => {
    const ch = channelRef.current;
    if (!ch) return;
    try {
      await ch.send({ type: 'broadcast', event: 'orders_updated', payload: { ts: Date.now(), ...(meta ?? {}) } });
    } catch {
      /* silent */
    }
  }, []);

  // === Edit: muat order ke cart ===
  const handleEditStart = async (orderId: number) => {
    try {
      const detail = await getOrderWithItems(orderId);
      const mapped: CartItem[] = (detail?.items ?? []).map((it: any) => {
        const p: Product =
          it.product ??
          products.find((pp) => pp.id === it.product_id) ?? {
            id: it.product_id,
            name: 'Item',
            price: it.price ?? 0,
            image_url: null,
            category_id: null as any,
          };
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          image_url: p.image_url,
          category_id: p.category_id,
          quantity: it.quantity ?? 1,
        } as CartItem;
      });
      setCustomerName(detail?.customer_name ?? '');
      setPaymentMethod((detail?.payment_method as PaymentMethod) ?? ''); // NEW: prefill
      setCart(mapped);
      setEditingOrderId(orderId);
      setIsQueueOpen(false);
      setIsCartOpen(true);
    } catch {
      /* silent */
    }
  };

  const cancelEdit = () => {
    setEditingOrderId(null);
    setCart([]);
    setCustomerName('');
    setPaymentMethod('');
  };

  const handleSubmitOrder = async () => {
    if (!user) return alert('Authentication error.');
    if (!paymentMethod) return; // guard
    setIsSubmitting(true);

    try {
      if (editingOrderId) {
        await updateOrderAndItems(editingOrderId, {
          customer_name: customerName,
          payment_method: paymentMethod, // NEW
          items: cart.map((c) => ({ product_id: c.id, quantity: c.quantity })),
        });
      } else {
        const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        await createOrder(cart, customerName, total, user, paymentMethod); // NEW
      }

      await sendOrdersUpdated({ source: editingOrderId ? 'update' : 'submit', orderId: editingOrderId ?? undefined });
      await fetchTodaySummary(); // refresh ringkasan instan

      setIsCartOpen(false);
      setIsQueueOpen(true);
      setCart([]);
      setCustomerName('');
      setPaymentMethod('');
      setEditingOrderId(null);
    } catch (error: any) {
      alert((editingOrderId ? 'Gagal mengupdate order: ' : 'Error placing order: ') + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, status: 'completed' | 'cancelled') => {
    try {
      await updateOrderStatus(orderId, status);
      await sendOrdersUpdated({ source: 'status', orderId, status });
      await fetchTodaySummary(); // refresh ringkasan instan
      if (editingOrderId === orderId) cancelEdit();
    } catch (error: any) {
      alert(`Gagal mengubah status order: ${error.message}`);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);
      if (existingItem) {
        return currentCart.map((item) => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item));
      }
      return [...currentCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
    } else {
      setCart((currentCart) =>
        currentCart.map((item) => (item.id === productId ? { ...item, quantity: newQuantity } : item)),
      );
    }
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart((currentCart) => currentCart.filter((item) => item.id !== productId));
  };

  const filteredProducts = products.filter((p) => p.category_id === activeCategory);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <div className="flex flex-col h-screen min-h-0 bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold">Halaman Barista</h1>
          <p className="text-sm text-gray-600">Logged in as: {profile?.full_name || user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsQueueOpen(true)} className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600">
            Queue ({pendingOrders.length})
          </button>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
            Logout
          </button>
        </div>
      </header>

      {/* Konten utama */}
      <div className="flex-grow min-h-0 pb-16 md:pb-0">
        <div className="flex h-full">
          {/* SIDEBAR RINGKASAN — kiri (desktop lg+) */}
          <aside className="hidden lg:block w-64 flex-shrink-0 border-r bg-white p-4">
            <h3 className="font-semibold text-sm text-gray-700">Ringkasan Hari Ini</h3>
            <div className="mt-3 space-y-3">
              <div className="p-3 rounded-lg border bg-gradient-to-br from-indigo-50 to-white">
                <div className="text-xs text-gray-500">Total Completed</div>
                <div className="text-2xl font-bold">{fmtIDR(todaySummary.total)}</div>
                <div className="text-xs text-gray-500 mt-1">{todaySummary.count} order</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded border">
                  <div className="text-xs text-gray-500">CASH</div>
                  <div className="font-semibold">{fmtIDR(todaySummary.cash)}</div>
                </div>
                <div className="p-2 rounded border">
                  <div className="text-xs text-gray-500">QRIS</div>
                  <div className="font-semibold">{fmtIDR(todaySummary.qris)}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* MENU */}
          <section className="flex-1 min-h-0 overflow-y-auto p-4">
            {/* Ringkasan kecil untuk mobile/tablet */}
            <div className="lg:hidden grid grid-cols-2 gap-2 mb-4">
              <div className="p-3 rounded-lg border bg-white">
                <div className="text-xs text-gray-500">Total Today</div>
                <div className="text-lg font-bold">{fmtIDR(todaySummary.total)}</div>
                <div className="text-xs text-gray-500">{todaySummary.count} order</div>
              </div>
              <div className="p-3 rounded-lg border bg-white">
                <div className="text-xs text-gray-500">Cash / QRIS</div>
                <div className="text-sm font-semibold leading-tight">
                  {fmtIDR(todaySummary.cash)} / {fmtIDR(todaySummary.qris)}
                </div>
              </div>
            </div>

            {/* Kategori */}
            <div className="mb-4 flex-shrink-0 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2 rounded ${activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-white'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Produk */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-lg shadow p-3 text-center flex flex-col">
                  <img
                    src={product.image_url || 'https://placehold.co/150x100/e2e8f0/e2e8f0?text=No-Image'}
                    alt={product.name}
                    className="w-full h-24 object-cover rounded-md mb-2"
                  />
                  <p className="font-bold text-sm truncate">{product.name}</p>
                  <p className="text-xs text-gray-600 mb-2">{new Intl.NumberFormat('id-ID').format(product.price)}</p>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="mt-auto bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700"
                  >
                    Tambah
                  </button>
                </div>
              ))}
            </div>
          </section>

          {/* CART desktop (sidebar kanan) */}
          <aside className="hidden md:block w-full md:w-80 lg:w-96 max-w-md flex-shrink-0 border-l">
            <OrderCart
              cart={cart}
              customerName={customerName}
              paymentMethod={paymentMethod}
              isSubmitting={isSubmitting}
              onCustomerNameChange={setCustomerName}
              onPaymentMethodChange={setPaymentMethod}
              onSubmit={handleSubmitOrder}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveFromCart}
              isEditing={editingOrderId !== null}
              onCancelEdit={cancelEdit}
            />
          </aside>
        </div>
      </div>

      {/* Sticky bar mobile untuk buka Cart */}
      <div className="md:hidden sticky bottom-0 left-0 right-0 bg-white border-t p-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCartOpen(true)}
            className="flex-1 bg-indigo-600 text-white py-3 rounded-md font-semibold"
          >
            {editingOrderId ? 'Edit Order' : 'Cart'} ({totalItems}) • {fmtIDR(totalPrice)}
          </button>
          <button onClick={() => setIsQueueOpen(true)} className="px-4 py-3 rounded-md bg-yellow-500 text-white font-semibold">
            Queue
          </button>
        </div>
      </div>

      <footer className="bg-white border-t w-full flex items-center justify-center py-3">
        <Link isExternal className="flex items-center gap-1 text-current" href="https://www.instagram.com/zidni_mufti/">
          <span className="text-default-600">Powered by</span>
          <p className="text-primary">Orang Ganteng</p>
        </Link>
      </footer>

      {/* MOBILE: Bottom Sheet Cart (FIX: tinggi pasti + flex kolom) */}
      {isCartOpen && (
        <div className="md:hidden fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsCartOpen(false)} />
          <div className="absolute left-0 right-0 bottom-0 h-[85dvh] bg-white rounded-t-2xl shadow-lg overflow-hidden flex flex-col">
            <OrderCart
              cart={cart}
              customerName={customerName}
              paymentMethod={paymentMethod}
              isSubmitting={isSubmitting}
              onCustomerNameChange={setCustomerName}
              onPaymentMethodChange={setPaymentMethod}
              onSubmit={handleSubmitOrder}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveFromCart}
              onClose={() => setIsCartOpen(false)}
              showClose
              isEditing={editingOrderId !== null}
              onCancelEdit={cancelEdit}
            />
          </div>
        </div>
      )}

      {/* Queue Modal */}
      {isQueueOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsQueueOpen(false)} />
          <div className="absolute inset-x-0 md:inset-auto md:right-6 md:left-6 top-10 bottom-10 bg-white rounded-xl shadow-xl p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-lg">Pending Orders Queue ({pendingOrders.length})</h3>
              <button onClick={() => setIsQueueOpen(false)} className="px-3 py-1 rounded bg-gray-100">
                Tutup
              </button>
            </div>
            <PendingOrdersList orders={pendingOrders} onUpdateStatus={handleUpdateStatus} onEdit={handleEditStart} />
          </div>
        </div>
      )}
    </div>
  );
};

export default BaristaPage;
