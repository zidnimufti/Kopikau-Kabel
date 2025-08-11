// --- FILE: src/pages/admin/OrderHistoryPage.tsx ---
// Responsif + Filter rentang tanggal + Ekspor Excel (DETAIL PER ITEM, COMPLETED saja)

import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { getAllOrders } from '../../api/adminApi'; // Sesuaikan path
import { Modal } from '../../components/ui/Modal';   // Sesuaikan path

// ----- Types -----
interface DetailedOrder {
  order_id: number;
  created_at: string;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  barista_name: string;
  items: { product_name: string; quantity: number; subtotal: number }[];
}

type StatusFilter = 'all' | 'completed' | 'pending' | 'cancelled';

interface ExcelItemRow {
  Tanggal: string;
  Pelanggan: string;
  Barista: string;
  Produk: string;
  Jumlah: number;
  'Harga/Item (Rp)': number;
  'Subtotal (Rp)': number;
}

// ----- Utils -----
const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);

const toInputDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
const startOfDay = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
};
const endOfDay = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
};

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<DetailedOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter status (untuk tampilan)
  const [filter, setFilter] = useState<StatusFilter>('all');

  // Filter tanggal (default 30 hari terakhir)
  const today = new Date();
  const defaultEnd = toInputDate(today);
  const d30 = new Date();
  d30.setDate(today.getDate() - 30);
  const defaultStart = toInputDate(d30);

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);

  useEffect(() => {
    setLoading(true);
    getAllOrders()
      .then((data) => setOrders(data ?? []))
      .finally(() => setLoading(false));
  }, []);

  // Quick ranges
  const applyDateQuick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(toInputDate(start));
    setEndDate(toInputDate(end));
  };
  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(toInputDate(start));
    setEndDate(toInputDate(now));
  };

  // Filter untuk TAMPILAN (status + tanggal)
  const filteredOrders = useMemo(() => {
    const s = startOfDay(startDate);
    const e = endOfDay(endDate);
    return orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      const inRange = t >= s && t <= e;
      const statusOk = filter === 'all' ? true : o.status === filter;
      return inRange && statusOk;
    });
  }, [orders, filter, startDate, endDate]);

  // Data untuk EKSPOR: selalu COMPLETED pada rentang tanggal (abaikan filter status tampilan)
  const completedInRange = useMemo(() => {
    const s = startOfDay(startDate);
    const e = endOfDay(endDate);
    return orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      return o.status === 'completed' && t >= s && t <= e;
    });
  }, [orders, startDate, endDate]);

  const totalOmset = useMemo(
    () => completedInRange.reduce((sum, o) => sum + (o.total_amount || 0), 0),
    [completedInRange]
  );

  // ===== Ekspor Excel: DETAIL PER ITEM (COMPLETED saja) =====
  const handleExportItemsDetail = () => {
    if (completedInRange.length === 0) {
      alert('Tidak ada order COMPLETED pada rentang tanggal yang dipilih.');
      return;
    }

    const rows: ExcelItemRow[] = [];
    completedInRange.forEach((o) => {
      (o.items || []).forEach((it) => {
        const unit = it.quantity ? it.subtotal / it.quantity : 0;
        rows.push({
          Tanggal: new Date(o.created_at).toLocaleString('id-ID'),
          Pelanggan: o.customer_name,
          Barista: o.barista_name,
          Produk: it.product_name,
          Jumlah: it.quantity,
          'Harga/Item (Rp)': unit,
          'Subtotal (Rp)': it.subtotal,
        });
      });
    });

    const total = rows.reduce((s, r) => s + (r['Subtotal (Rp)'] || 0), 0);
    rows.push({
      Tanggal: '',
      Pelanggan: 'TOTAL OMSET',
      Barista: '',
      Produk: '',
      Jumlah: 0,
      'Harga/Item (Rp)': 0,
      'Subtotal (Rp)': total,
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detail Item (Completed)');

    const fileName = `Order_Completed_Detail_Item_${startDate}_sd_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) return <div className="p-4 sm:p-6">Loading order history...</div>;

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4">Riwayat Order</h1>

      {/* Filter Panel */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Status filter (untuk tampilan) */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <div className="flex flex-wrap gap-2">
              {(['all', 'completed', 'pending', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-2 rounded-md text-sm font-medium capitalize ${
                    filter === status ? 'bg-indigo-600 text-white' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Date pickers */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Selesai</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applyDateQuick(7)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
            >
              7 hari
            </button>
            <button
              onClick={() => applyDateQuick(30)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
            >
              30 hari
            </button>
            <button
              onClick={setThisMonth}
              className="hidden lg:inline-flex bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
            >
              Bulan ini
            </button>

            {/* Ekspor DETAIL PER ITEM (completed saja) */}
            <button
              onClick={handleExportItemsDetail}
              disabled={completedInRange.length === 0}
              className="flex-1 md:flex-none bg-teal-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-teal-700 disabled:opacity-60"
            >
              Ekspor Excel (Detail Item)
            </button>
          </div>
        </div>

        {/* Ringkasan */}
        <div className="mt-3 text-sm text-gray-700">
          Completed dalam rentang: <span className="font-semibold">{completedInRange.length}</span>{' '}
          order • Total Omset:{' '}
          <span className="font-semibold">
            {fmtIDR(completedInRange.reduce((s, o) => s + (o.total_amount || 0), 0))}
          </span>
        </div>
      </div>

      {/* MOBILE: Card list */}
      <div className="sm:hidden space-y-3">
        {filteredOrders.map((order) => (
          <div key={order.order_id} className="bg-white shadow rounded-lg p-4">
            <div className="text-xs text-gray-500">
              {new Date(order.created_at).toLocaleString('id-ID')}
            </div>
            <div className="mt-1 font-semibold">{order.customer_name}</div>
            <div className="text-sm text-gray-600">Barista: {order.barista_name}</div>
            <div className="mt-2 flex justify-between text-sm">
              <span
                className={`px-2 py-0.5 rounded-full ${getStatusChipColor(order.status)}`}
              >
                {order.status}
              </span>
              <span className="font-medium">{fmtIDR(order.total_amount)}</span>
            </div>
            <button
              onClick={() => setSelectedOrder(order)}
              className="mt-3 w-full text-indigo-600 hover:underline text-sm"
            >
              Lihat Detail
            </button>
          </div>
        ))}
        {filteredOrders.length === 0 && (
          <div className="text-center text-gray-500 py-8">Tidak ada order.</div>
        )}
      </div>

      {/* DESKTOP/TABLET: Table */}
      <div className="hidden sm:block bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-[900px] w-full divide-y divide-gray-200">
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
            {filteredOrders.map((order) => (
              <tr key={order.order_id} className="align-top">
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(order.created_at).toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{order.customer_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{order.barista_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fmtIDR(order.total_amount)}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusChipColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="text-indigo-600 hover:underline text-sm"
                  >
                    Lihat Detail
                  </button>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada order.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Item */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Detail Order #${selectedOrder?.order_id ?? ''}`}
      >
        {selectedOrder && selectedOrder.items && selectedOrder.items.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {selectedOrder.items.map((item, idx) => (
              <li key={idx} className="py-2 flex justify-between text-sm">
                <span>
                  {item.quantity}x {item.product_name}
                </span>
                <span>{fmtIDR(item.subtotal)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">Tidak ada item dalam pesanan ini.</p>
        )}
      </Modal>
    </div>
  );
};

export default OrderHistoryPage;
