import { useState, useEffect, useMemo } from 'react';
import { getAllOrders } from '../../api/adminApi'; // Sesuaikan path
import { Modal } from '../../components/ui/Modal'; // Sesuaikan path

// Tipe data untuk order yang sudah digabungkan
interface DetailedOrder {
    order_id: number;
    created_at: string;
    customer_name: string;
    total_amount: number;
    status: 'pending' | 'completed' | 'cancelled';
    barista_name: string;
    items: { product_name: string; quantity: number; subtotal: number }[];
}

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState<DetailedOrder[]>([]);
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'cancelled'>('all');
    const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAllOrders()
            .then(data => setOrders(data ?? []))
            .finally(() => setLoading(false));
    }, []);

    const filteredOrders = useMemo(() => {
        if (filter === 'all') return orders;
        return orders.filter(order => order.status === filter);
    }, [orders, filter]);

    const getStatusChipColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) return <div>Loading order history...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Riwayat Order</h1>
            
            {/* Tombol Filter */}
            <div className="flex gap-2 mb-4">
                {(['all', 'completed', 'pending', 'cancelled'] as const).map(status => (
                    <button 
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium capitalize ${filter === status ? 'bg-indigo-600 text-white' : 'bg-white hover:bg-gray-50'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Tabel Riwayat Order */}
            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barista</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredOrders.map(order => (
                            <tr key={order.order_id}>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(order.created_at).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{order.customer_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{order.barista_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(order.total_amount)}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipColor(order.status)}`}>
                                        {order.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button onClick={() => setSelectedOrder(order)} className="text-indigo-600 hover:underline text-sm">Lihat Detail</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal untuk Detail Item */}
            <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Detail Order #${selectedOrder?.order_id}`}>
                {selectedOrder && (
                    <ul className="divide-y divide-gray-200">
                        {selectedOrder.items?.map((item, index) => (
                            <li key={index} className="py-2 flex justify-between">
                                <span>{item.quantity}x {item.product_name}</span>
                                <span>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.subtotal)}</span>
                            </li>
                        )) || <p>Tidak ada item dalam pesanan ini.</p>}
                    </ul>
                )}
            </Modal>
        </div>
    );
};

export default OrderHistoryPage;
