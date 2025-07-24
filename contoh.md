// --- FILE 1 (BARU): src/lib/realtimeService.ts ---
// Deskripsi: Layanan Singleton ini menjadi satu-satunya pengelola koneksi
//            real-time untuk seluruh aplikasi, menghilangkan semua race condition.

import { supabase } from '../api/supabaseClient'; // Sesuaikan path

// Buat SATU channel yang konsisten untuk seluruh aplikasi.
const channel = supabase.channel('orders-channel');
let isSubscribed = false;
const callbacks = new Set<() => void>();

const handleBroadcast = (payload: any) => {
    console.log('Sinyal broadcast diterima!', payload);
    // Panggil semua fungsi callback yang terdaftar
    callbacks.forEach(callback => callback());
};

const ensureSubscribed = () => {
    if (isSubscribed) {
        return;
    }
    isSubscribed = true;
    channel
        .on('broadcast', { event: 'orders_updated' }, handleBroadcast)
        .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
                console.log('Berhasil terhubung ke channel real-time!');
                // Panggil semua callback sekali saat berhasil terhubung untuk sinkronisasi awal
                callbacks.forEach(callback => callback());
            }
        });
};

// Fungsi untuk berlangganan (subscribe) ke pembaruan
const subscribe = (callback: () => void) => {
    ensureSubscribed();
    callbacks.add(callback);

    // Kembalikan fungsi cleanup yang spesifik
    return () => {
        console.log('Berhenti berlangganan dari pembaruan channel.');
        callbacks.delete(callback);
    };
};

// Fungsi untuk mengirim sinyal pembaruan
const broadcast = async () => {
    try {
        await channel.send({
            type: 'broadcast',
            event: 'orders_updated',
        });
    } catch (error) {
        console.error('Gagal mengirim broadcast:', error);
    }
};

// Ekspor semua fungsi sebagai satu layanan
export const realtimeService = {
    subscribe,
    broadcast,
};


// --- FILE 2 (GANTI): src/hooks/useRealtimeOrders.ts ---
// Deskripsi: Ditulis ulang untuk menggunakan realtimeService yang baru.
//            Kodenya sekarang jauh lebih bersih dan lebih andal.

import { useState, useEffect, useCallback } from 'react';
import { getPendingOrders } from '../api/orderApi'; // Sesuaikan path
import { Order } from '../types'; // Sesuaikan path
import { realtimeService } from '../lib/realtimeService'; // <-- IMPORT LAYANAN BARU

export const useRealtimeOrders = () => {
    const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        try {
            const data = await getPendingOrders();
            setPendingOrders(data ?? []);
        } catch (error) {
            console.error("Gagal memuat pending orders:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        // Fungsi subscribe sekarang mengembalikan fungsi cleanup-nya sendiri
        const unsubscribe = realtimeService.subscribe(fetchOrders);

        // Cleanup: Panggil fungsi unsubscribe yang dikembalikan oleh layanan
        return () => {
            unsubscribe();
        };
    }, [fetchOrders]);

    return { 
        pendingOrders, 
        isLoading, 
        broadcastUpdate: realtimeService.broadcast // Ekspor fungsi broadcast dari layanan
    };
};


// --- FILE 3 (PASTIKAN SEPERTI INI): src/pages/barista/BaristaPage.tsx ---
// Deskripsi: Kode di bawah ini seharusnya sudah benar dan tidak perlu Anda ubah,
//            karena sekarang ia menggunakan hook useRealtimeOrders yang sudah diperbaiki.

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Category, Product, CartItem } from '../../types';
import { getActiveMenu, createOrder, updateOrderStatus } from '../../api/orderApi';
import { useAuth } from '../../auth/hooks/useAuth';
import { useProfile } from '../../auth/hooks/useProfile';
import { useRealtimeOrders } from '../../hooks/useRealtimeOrders';

const TrashIcon=()=>(<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.134H8.09c-1.18 0-2.09.954-2.09 2.134v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>);
interface OrderCartProps{cart:CartItem[];customerName:string;isSubmitting:boolean;onCustomerNameChange:(name:string)=>void;onUpdateQuantity:(productId:number,newQuantity:number)=>void;onRemoveItem:(productId:number)=>void;onSubmit:()=>void;}
const OrderCart=({cart,customerName,isSubmitting,onCustomerNameChange,onUpdateQuantity,onRemoveItem,onSubmit}:OrderCartProps)=>{const total=cart.reduce((sum,item)=>sum+item.price*item.quantity,0);return(<div className="bg-white h-full flex flex-col p-4 shadow-lg"><h2 className="text-xl font-bold mb-4">Current Order</h2><div className="mb-4"><label className="block text-sm font-medium text-gray-700">Customer Name</label><input type="text" value={customerName} onChange={(e)=>onCustomerNameChange(e.target.value)} placeholder="e.g., John Doe" className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500"/></div><div className="flex-grow overflow-y-auto">{cart.length===0?(<p className="text-gray-500">Cart is empty.</p>):(<ul className="divide-y divide-gray-200">{cart.map(item=>(<li key={item.id} className="py-3 flex flex-col"><div className="flex justify-between items-center"><p className="font-medium">{item.name}</p><p className="font-semibold">{new Intl.NumberFormat('id-ID').format(item.price*item.quantity)}</p></div><div className="flex items-center justify-between mt-2"><p className="text-sm text-gray-500">{new Intl.NumberFormat('id-ID').format(item.price)} x {item.quantity}</p><div className="flex items-center gap-2"><button onClick={()=>onUpdateQuantity(item.id,item.quantity-1)} className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center font-bold">-</button><span>{item.quantity}</span><button onClick={()=>onUpdateQuantity(item.id,item.quantity+1)} className="bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center font-bold">+</button><button onClick={()=>onRemoveItem(item.id)} className="text-red-500 hover:text-red-700 ml-2"><TrashIcon/></button></div></div></li>))}</ul>)}</div><div className="border-t pt-4"><div className="flex justify-between items-center font-bold text-lg mb-4"><span>Total</span><span>{new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR'}).format(total)}</span></div><button onClick={onSubmit} disabled={cart.length===0||!customerName||isSubmitting} className="w-full bg-green-600 text-white py-3 rounded-md text-lg font-bold hover:bg-green-700 disabled:bg-gray-400">{isSubmitting?'Placing Order...':'Place Order'}</button></div></div>);};

const BaristaPage = () => {
    const { user, logout } = useAuth();
    const { profile } = useProfile();
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState<number | null>(null);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerName, setCustomerName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { pendingOrders, isLoading: isLoadingOrders, broadcastUpdate } = useRealtimeOrders();

    useEffect(() => {
        getActiveMenu().then(({ products, categories }) => {
            setProducts(products);
            setCategories(categories);
            if (categories.length > 0) setActiveCategory(categories[0].id);
        });
    }, []);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleSubmitOrder = async () => {
        if (!user) return alert("Authentication error.");
        setIsSubmitting(true);
        try {
            const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
            await createOrder(cart, customerName, total, user);
            await broadcastUpdate();
            setCart([]);
            setCustomerName('');
        } catch (error: any) {
            alert("Error placing order: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateStatus = async (orderId: number, status: 'completed' | 'cancelled') => {
        try {
            await updateOrderStatus(orderId, status);
            await broadcastUpdate();
        } catch (error: any) {
            alert(`Gagal mengubah status order: ${error.message}`);
        }
    };

    const handleAddToCart = (product: Product) => { setCart(currentCart => { const existingItem = currentCart.find(item => item.id === product.id); if (existingItem) { return currentCart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item ); } return [...currentCart, { ...product, quantity: 1 }]; }); };
    const handleUpdateQuantity = (productId: number, newQuantity: number) => { if (newQuantity <= 0) { handleRemoveFromCart(productId); } else { setCart(currentCart => currentCart.map(item => item.id === productId ? { ...item, quantity: newQuantity } : item ) ); } };
    const handleRemoveFromCart = (productId: number) => { setCart(currentCart => currentCart.filter(item => item.id !== productId)); };

    const filteredProducts = products.filter(p => p.category_id === activeCategory);

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            <header className="bg-white shadow-sm p-4 flex justify-between items-center flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold">POS Barista</h1>
                    <p className="text-sm text-gray-600">Logged in as: {profile?.full_name || user?.email}</p>
                </div>
                <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600">
                    Logout
                </button>
            </header>
            <div className="flex flex-grow overflow-hidden">
                <div className="flex-grow p-4 flex flex-col">
                    <div className="mb-4 flex-shrink-0">
                        {categories.map(cat => (
                            <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2 mr-2 rounded ${activeCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-white'}`}>
                                {cat.name}
                            </button>
                        ))}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 overflow-y-auto">
                        {filteredProducts.map(product => (
                            <button key={product.id} onClick={() => handleAddToCart(product)} className="bg-white rounded-lg shadow p-3 text-center hover:bg-indigo-50 flex flex-col items-center justify-between">
                                <img 
                                    src={product.image_url || 'https://placehold.co/150x100/e2e8f0/e2e8f0?text=No-Image'} 
                                    alt={product.name}
                                    className="w-full h-24 object-cover rounded-md mb-2"
                                />
                                <div className="flex-grow flex flex-col justify-center">
                                    <p className="font-bold text-sm">{product.name}</p>
                                    <p className="text-xs text-gray-600">{new Intl.NumberFormat('id-ID').format(product.price)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-full md:w-1/3 lg:w-1/4 flex-shrink-0">
                    <OrderCart
                        cart={cart}
                        customerName={customerName}
                        isSubmitting={isSubmitting}
                        onCustomerNameChange={setCustomerName}
                        onSubmit={handleSubmitOrder}
                        onUpdateQuantity={handleUpdateQuantity}
                        onRemoveItem={handleRemoveFromCart}
                    />
                </div>
            </div>
            <div className="flex-shrink-0 p-4 bg-gray-100 border-t">
                <h3 className="font-bold text-lg mb-2">Pending Orders Queue ({pendingOrders.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {isLoadingOrders ? <p>Loading queue...</p> : pendingOrders.map(order => (
                        <div key={order.id} className="bg-yellow-100 p-3 rounded-md shadow flex flex-col justify-between">
                            <div>
                                <p className="font-bold text-lg">{order.customer_name}</p>
                                <p className="text-sm text-gray-600">Order #{order.id}</p>
                            </div>
                            <div className="flex gap-2 mt-2">
                                <button onClick={() => handleUpdateStatus(order.id, 'completed')} className="flex-1 bg-green-500 text-white text-xs py-1 rounded hover:bg-green-600">Selesai</button>
                                <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="flex-1 bg-red-500 text-white text-xs py-1 rounded hover:bg-red-600">Batal</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BaristaPage;
