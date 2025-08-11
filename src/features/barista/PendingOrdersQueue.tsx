import { useState, useEffect } from 'react';
import { getPendingOrders, updateOrderStatus } from '../../api/orderApi';
import { Order } from '../../types';
import { supabase } from '../../api/supabaseClient';

export const PendingOrdersQueue = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Ambil data awal
        getPendingOrders().then(data => {
            setOrders(data);
            setLoading(false);
        });

        // Setup listener real-time
        const channel = supabase.channel('public:orders')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
                console.log('Change received!', payload);
                // Jika ada order baru dengan status pending, tambahkan ke list
                if (payload.eventType === 'INSERT' && payload.new.status === 'pending') {
                    setOrders(currentOrders => [...currentOrders, payload.new as Order]);
                }
                // Jika ada order yang diupdate (misal statusnya), hapus dari list pending
                if (payload.eventType === 'UPDATE') {
                    if(payload.new.status !== 'pending') {
                        setOrders(currentOrders => currentOrders.filter(o => o.id !== payload.new.id));
                    }
                }
            })
            .subscribe();
        
        // Cleanup listener saat komponen unmount
        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const handleCompleteOrder = async (orderId: number) => {
        try {
            await updateOrderStatus(orderId, 'completed');
            // State akan diupdate oleh listener real-time, tidak perlu manual
        } catch (error) {
            console.error("Failed to complete order:", error);
            alert("Failed to complete order.");
        }
    };

    return (
        <div className="mt-6 p-4 bg-white rounded-lg shadow">
            <h3 className="font-bold text-lg mb-2">Pending Orders Queue</h3>
            {loading && <p>Loading queue...</p>}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {orders.map(order => (
                    <div key={order.id} className="bg-yellow-100 p-3 rounded-md shadow flex flex-col justify-between">
                        <div>
                            <p className="font-bold text-lg">{order.customer_name}</p>
                            <p className="text-sm text-gray-600">Order #{order.id}</p>
                        </div>
                        <button onClick={() => handleCompleteOrder(order.id)} className="mt-2 w-full bg-blue-500 text-white py-1 rounded hover:bg-blue-600">
                            Complete
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};