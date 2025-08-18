// --- FILE: src/pages/admin/OrderHistoryPage.tsx ---
import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { getAllOrders, deleteOrder } from '../../api/adminApi';
import { Modal } from '../../components/ui/Modal';

// ===== Types =====
interface DetailedOrder {
  order_id: number;
  created_at: string;
  customer_name: string;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  barista_name: string;
  payment_method?: 'cash' | 'qris' | null;
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
  Metode: string;
}
interface GroupRow { key: string; qty: number; total: number; lastAt?: number; }
interface GroupBPRow { barista: string; product: string; qty: number; total: number; }

// ===== Utils =====
const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);
const toInputDate = (d: Date) => {
  const yyyy = d.getFullYear(); const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0'); return `${yyyy}-${mm}-${dd}`;
};
const startOfDay = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d,0,0,0,0).getTime(); };
const endOfDay   = (s: string) => { const [y,m,d] = s.split('-').map(Number); return new Date(y,m-1,d,23,59,59,999).getTime(); };

const chipStatus = (st: string) =>
  st === 'completed' ? 'bg-green-100 text-green-800'
  : st === 'pending' ? 'bg-yellow-100 text-yellow-800'
  : st === 'cancelled' ? 'bg-red-100 text-red-800'
  : 'bg-gray-100 text-gray-800';

const chipPay = (pm?: 'cash'|'qris'|null) =>
  pm === 'cash' ? 'bg-purple-100 text-purple-700'
  : pm === 'qris' ? 'bg-cyan-100 text-cyan-700'
  : 'bg-gray-100 text-gray-700';

type ViewTab = 'orders' | 'produk' | 'barista' | 'baristaProduk';

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState<DetailedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');

  const today = new Date();
  const defaultEnd = toInputDate(today);
  const d30 = new Date(); d30.setDate(today.getDate() - 30);
  const defaultStart = toInputDate(d30);

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tab, setTab] = useState<ViewTab>('orders');

  useEffect(() => {
    setLoading(true);
    getAllOrders().then((data) => setOrders(data ?? [])).finally(() => setLoading(false));
  }, []);

  // quick ranges
  const quick = (days: number) => {
    const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days);
    setStartDate(toInputDate(start)); setEndDate(toInputDate(end));
  };
  const thisMonth = () => {
    const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(toInputDate(start)); setEndDate(toInputDate(now));
  };

  const sMs = useMemo(() => startOfDay(startDate), [startDate]);
  const eMs = useMemo(() => endOfDay(endDate), [endDate]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      const inRange = t >= sMs && t <= eMs;
      const statusOk = filter === 'all' ? true : o.status === filter;
      return inRange && statusOk;
    }),
    [orders, filter, sMs, eMs]
  );

  // Flatten items (completed only)
  const completedRows = useMemo(() => {
    const rows: {
      created_at: string; customer_name: string; barista_name: string;
      product_name: string; quantity: number; subtotal: number; payment_method?: 'cash'|'qris'|null;
    }[] = [];
    orders.forEach((o) => {
      const t = new Date(o.created_at).getTime();
      if (o.status !== 'completed' || t < sMs || t > eMs) return;
      (o.items || []).forEach((it) =>
        rows.push({
          created_at: o.created_at,
          customer_name: o.customer_name,
          barista_name: o.barista_name,
          product_name: it.product_name,
          quantity: it.quantity,
          subtotal: it.subtotal,
          payment_method: o.payment_method ?? null,
        })
      );
    });
    return rows;
  }, [orders, sMs, eMs]);

  const totalOmsetCompleted = useMemo(
    () => completedRows.reduce((s, r) => s + (r.subtotal || 0), 0),
    [completedRows]
  );

  // Rekap
  const rekapProduk: GroupRow[] = useMemo(() => {
    const map = new Map<string, { qty: number; total: number; lastAt: number }>();
    completedRows.forEach((r) => {
      const cur = map.get(r.product_name) || { qty: 0, total: 0, lastAt: 0 };
      cur.qty += r.quantity || 0; cur.total += r.subtotal || 0;
      const t = new Date(r.created_at).getTime(); if (t > cur.lastAt) cur.lastAt = t;
      map.set(r.product_name, cur);
    });
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, qty: v.qty, total: v.total, lastAt: v.lastAt }))
      .sort((a, b) => b.total - a.total);
  }, [completedRows]);

  const rekapBarista: GroupRow[] = useMemo(() => {
    const map = new Map<string, { qty: number; total: number }>();
    completedRows.forEach((r) => {
      const key = r.barista_name || '—';
      const cur = map.get(key) || { qty: 0, total: 0 };
      cur.qty += r.quantity || 0; cur.total += r.subtotal || 0;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([key, v]) => ({ key, qty: v.qty, total: v.total }))
      .sort((a, b) => b.total - a.total);
  }, [completedRows]);

  const rekapBaristaProduk: GroupBPRow[] = useMemo(() => {
    const map = new Map<string, { qty: number; total: number }>();
    completedRows.forEach((r) => {
      const key = `${r.barista_name || '—'}@@${r.product_name}`;
      const cur = map.get(key) || { qty: 0, total: 0 };
      cur.qty += r.quantity || 0; cur.total += r.subtotal || 0;
      map.set(key, cur);
    });
    return Array.from(map.entries()).map(([k, v]) => {
      const [barista, product] = k.split('@@'); return { barista, product, qty: v.qty, total: v.total };
    }).sort((a, b) => b.total - a.total);
  }, [completedRows]);

  // Exporters
  const exportDetailItem = () => {
    if (completedRows.length === 0) return alert('Tidak ada transaksi COMPLETED pada rentang ini.');
    const rows: ExcelItemRow[] = completedRows.map((r) => ({
      Tanggal: new Date(r.created_at).toLocaleString('id-ID'),
      Pelanggan: r.customer_name,
      Barista: r.barista_name,
      Produk: r.product_name,
      Jumlah: r.quantity,
      'Harga/Item (Rp)': r.quantity ? r.subtotal / r.quantity : 0,
      'Subtotal (Rp)': r.subtotal,
      Metode: (r.payment_method || '').toUpperCase(),
    }));
    rows.push({ Tanggal: '', Pelanggan: 'TOTAL OMSET', Barista: '', Produk: '', Jumlah: 0, 'Harga/Item (Rp)': 0, 'Subtotal (Rp)': totalOmsetCompleted, Metode: '' });
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detail Item (Completed)');
    XLSX.writeFile(wb, `Detail_Item_Completed_${startDate}_sd_${endDate}.xlsx`);
  };
  const exportRekapProduk = () => {
    if (rekapProduk.length === 0) return alert('Tidak ada data rekap Produk pada rentang ini.');
    const rows = rekapProduk.map((r) => ({
      Tanggal: r.lastAt ? new Date(r.lastAt).toLocaleDateString('id-ID') : '',
      Produk: r.key, Jumlah: r.qty, 'Total (Rp)': r.total,
    }));
    rows.push({ Tanggal: '', Produk: 'TOTAL', Jumlah: rekapProduk.reduce((s, r) => s + r.qty, 0), 'Total (Rp)': rekapProduk.reduce((s, r) => s + r.total, 0) });
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Produk');
    XLSX.writeFile(wb, `Rekap_Produk_${startDate}_sd_${endDate}.xlsx`);
  };
  const exportRekapBarista = () => {
    if (rekapBarista.length === 0) return alert('Tidak ada data rekap Barista pada rentang ini.');
    const rows = rekapBarista.map((r) => ({ Barista: r.key, 'Jumlah Item': r.qty, 'Total (Rp)': r.total }));
    rows.push({ Barista: 'TOTAL', 'Jumlah Item': rekapBarista.reduce((s, r) => s + r.qty, 0), 'Total (Rp)': rekapBarista.reduce((s, r) => s + r.total, 0) });
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap Barista');
    XLSX.writeFile(wb, `Rekap_Barista_${startDate}_sd_${endDate}.xlsx`);
  };
  const exportBaristaProduk = () => {
    if (rekapBaristaProduk.length === 0) return alert('Tidak ada data Barista × Produk pada rentang ini.');
    const rows = rekapBaristaProduk.map((r) => ({ Barista: r.barista, Produk: r.product, Jumlah: r.qty, 'Total (Rp)': r.total }));
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Barista x Produk');
    XLSX.writeFile(wb, `Barista_x_Produk_${startDate}_sd_${endDate}.xlsx`);
  };

  // Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm('Hapus order ini secara permanen?')) return;
    setDeletingId(id);
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.order_id !== id));
      if (selectedOrder?.order_id === id) setSelectedOrder(null);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div className="p-4 sm:p-6">Loading…</div>;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold mb-4">Riwayat & Ringkasan Penjualan</h1>

      {/* Filter panel */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status (tampilan Orders)</label>
            <div className="flex flex-wrap gap-2">
              {(['all','completed','pending','cancelled'] as const).map((s) => (
                <button key={s} onClick={() => setFilter(s)}
                  className={`px-3 py-2 rounded-md text-sm font-medium capitalize ${filter===s?'bg-indigo-600 text-white':'bg-gray-100 hover:bg-gray-200'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>
          {/* Date pickers */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Mulai</label>
            <input type="date" value={startDate} max={endDate} onChange={(e)=>setStartDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"/>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tanggal Selesai</label>
            <input type="date" value={endDate} min={startDate} onChange={(e)=>setEndDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"/>
          </div>
          {/* Quick */}
          <div className="flex flex-wrap gap-2">
            <button onClick={()=>quick(7)}  className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm">7 hari</button>
            <button onClick={()=>quick(30)} className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm">30 hari</button>
            <button onClick={thisMonth}    className="hidden lg:inline-flex bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm">Bulan ini</button>
          </div>
        </div>

        <div className="mt-3 text-sm text-gray-700">
          Completed (item) dalam rentang: <span className="font-semibold">{completedRows.length}</span> baris •
          Total Omset: <span className="font-semibold">{fmtIDR(totalOmsetCompleted)}</span>
        </div>
      </div>

      {/* Tabs + Export row (scrollable on small) */}
      <div className="mb-3 flex flex-col sm:flex-row gap-2 sm:items-center">
        <div className="flex gap-2 overflow-x-auto whitespace-nowrap">
          <button onClick={()=>setTab('orders')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab==='orders'?'bg-indigo-600 text-white':'bg-white hover:bg-gray-50'}`}>Orders</button>
          <button onClick={()=>setTab('produk')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab==='produk'?'bg-indigo-600 text-white':'bg-white hover:bg-gray-50'}`}>Rekap Produk</button>
          <button onClick={()=>setTab('barista')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab==='barista'?'bg-indigo-600 text-white':'bg-white hover:bg-gray-50'}`}>Rekap Barista</button>
          <button onClick={()=>setTab('baristaProduk')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab==='baristaProduk'?'bg-indigo-600 text-white':'bg-white hover:bg-gray-50'}`}>Barista × Produk</button>
        </div>

        <div className="sm:ml-auto flex gap-2 flex-wrap">
          <button onClick={exportDetailItem}
            className="bg-teal-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-teal-700">
            Ekspor Excel — Detail Per Item
          </button>
          {tab==='produk' && (
            <button onClick={exportRekapProduk}
              className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
              Ekspor Rekap Produk
            </button>
          )}
          {tab==='barista' && (
            <button onClick={exportRekapBarista}
              className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
              Ekspor Rekap Barista
            </button>
          )}
          {tab==='baristaProduk' && (
            <button onClick={exportBaristaProduk}
              className="bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700">
              Ekspor Barista × Produk
            </button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {tab === 'orders' && (
        <>
          {/* MOBILE & TABLET KECIL: Card list (≤ md) */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.order_id} className="bg-white shadow rounded-lg p-4">
                <div className="text-xs text-gray-500">{new Date(order.created_at).toLocaleString('id-ID')}</div>
                <div className="mt-1 font-semibold">{order.customer_name}</div>
                <div className="text-sm text-gray-600">Barista: {order.barista_name}</div>
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <span className={`px-2 py-0.5 rounded-full ${chipStatus(order.status)}`}>{order.status}</span>
                  <span className={`px-2 py-0.5 rounded-full ${chipPay(order.payment_method)}`}>{(order.payment_method || '—').toString().toUpperCase()}</span>
                </div>
                <div className="mt-1 font-medium">{fmtIDR(order.total_amount)}</div>
                <div className="mt-3 flex gap-3">
                  <button onClick={()=>setSelectedOrder(order)} className="text-indigo-600 hover:underline text-sm">Lihat Detail</button>
                  <button onClick={()=>handleDelete(order.order_id)} disabled={deletingId===order.order_id}
                          className="text-red-600 hover:underline text-sm disabled:opacity-60">
                    {deletingId===order.order_id?'Menghapus…':'Hapus'}
                  </button>
                </div>
              </div>
            ))}
            {filteredOrders.length === 0 && <div className="text-center text-gray-500 py-8">Tidak ada order.</div>}
          </div>

          {/* ≥ md: Table */}
          <div className="hidden md:block bg-white shadow-md rounded-lg overflow-x-auto">
            <table className="min-w-[760px] lg:min-w-[980px] w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pelanggan</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Barista</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Metode</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.order_id} className="align-top">
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">{new Date(order.created_at).toLocaleString('id-ID')}</td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">{order.customer_name}</td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap hidden md:table-cell">{order.barista_name}</td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap hidden lg:table-cell">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${chipPay(order.payment_method)}`}>
                        {(order.payment_method || '—')?.toString().toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">{fmtIDR(order.total_amount)}</td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${chipStatus(order.status)}`}>{order.status}</span>
                    </td>
                    <td className="px-4 lg:px-6 py-3 whitespace-nowrap hidden md:table-cell space-x-3">
                      <button onClick={()=>setSelectedOrder(order)} className="text-indigo-600 hover:underline text-sm">Lihat Detail</button>
                      <button onClick={()=>handleDelete(order.order_id)} disabled={deletingId===order.order_id} className="text-red-600 hover:underline text-sm disabled:opacity-60">
                        {deletingId===order.order_id?'Menghapus…':'Hapus'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredOrders.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Tidak ada order.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Rekap Produk */}
      {tab === 'produk' && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-[640px] lg:min-w-[760px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rekapProduk.map((r) => (
                <tr key={r.key}>
                  <td className="px-4 lg:px-6 py-3 whitespace-nowrap">{r.lastAt ? new Date(r.lastAt).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="px-4 lg:px-6 py-3">{r.key}</td>
                  <td className="px-4 lg:px-6 py-3 text-right">{r.qty}</td>
                  <td className="px-4 lg:px-6 py-3 text-right">{fmtIDR(r.total)}</td>
                </tr>
              ))}
              {rekapProduk.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
              )}
            </tbody>
            {rekapProduk.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50">
                  <td className="px-4 lg:px-6 py-3 font-semibold">TOTAL</td>
                  <td />
                  <td className="px-4 lg:px-6 py-3 text-right font-semibold">{rekapProduk.reduce((s, r) => s + r.qty, 0)}</td>
                  <td className="px-4 lg:px-6 py-3 text-right font-semibold">{fmtIDR(rekapProduk.reduce((s, r) => s + r.total, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Rekap Barista */}
      {tab === 'barista' && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-[520px] lg:min-w-[640px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left  text-xs font-medium text-gray-500 uppercase">Barista</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah Item</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rekapBarista.map((r) => (
                <tr key={r.key}>
                  <td className="px-4 lg:px-6 py-3">{r.key}</td>
                  <td className="px-4 lg:px-6 py-3 text-right">{r.qty}</td>
                  <td className="px-4 lg:px-6 py-3 text-right">{fmtIDR(r.total)}</td>
                </tr>
              ))}
              {rekapBarista.length === 0 && (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
              )}
            </tbody>
            {rekapBarista.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50">
                  <td className="px-4 lg:px-6 py-3 font-semibold">TOTAL</td>
                  <td className="px-4 lg:px-6 py-3 text-right font-semibold">{rekapBarista.reduce((s, r) => s + r.qty, 0)}</td>
                  <td className="px-4 lg:px-6 py-3 text-right font-semibold">{fmtIDR(rekapBarista.reduce((s, r) => s + r.total, 0))}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Barista × Produk */}
      {tab === 'baristaProduk' && (
        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
          <table className="min-w-[640px] lg:min-w-[760px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barista</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rekapBaristaProduk.map((r, idx) => (
                <tr key={`${r.barista}-${r.product}-${idx}`}>
                  <td className="px-4 lg:px-6 py-3">{r.barista}</td>
                  <td className="px-4 lg:px-6 py-3">{r.product}</td>
                  <td className="px-4 lg:px-6 py-3 text-right">{r.qty}</td>
                  <td className="px-4 lg:px-6 py-3 text-right">{fmtIDR(r.total)}</td>
                </tr>
              ))}
              {rekapBaristaProduk.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Tidak ada data.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Detail */}
      <Modal isOpen={!!selectedOrder} onClose={()=>setSelectedOrder(null)} title={`Detail Order #${selectedOrder?.order_id ?? ''}`}>
        {selectedOrder && selectedOrder.items && selectedOrder.items.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {selectedOrder.items.map((item, i) => (
              <li key={i} className="py-2 flex justify-between text-sm">
                <span>{item.quantity}x {item.product_name}</span>
                <span>{fmtIDR(item.subtotal)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="text-gray-500">Tidak ada item dalam pesanan ini.</p>}
      </Modal>
    </div>
  );
};

export default OrderHistoryPage;
