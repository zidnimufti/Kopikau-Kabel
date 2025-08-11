import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBaristaDetails, getBaristaSalesDetails } from '../../api/adminApi';
import { UserProfile } from '../../types';
import * as XLSX from 'xlsx';

// ---------- Types ----------
interface SalesDetail {
  sale_date: string;
  product_name: string;
  quantity_sold: number;
  total_price: number;
}

interface ExcelRow {
  Tanggal: string;
  'Produk Terjual': string;
  Jumlah: number | null;
  'Total (Rp)': number;
}

// ---------- Util helpers ----------
const fmtIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(n);

const toInputDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};
// ISO untuk awal/akhir hari (pakai zona waktu lokal)
const startOfDayISO = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
};
const endOfDayISO = (dateStr: string) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
};

const BaristaDetailPage = () => {
  const { baristaId } = useParams<{ baristaId: string }>();

  const [barista, setBarista] = useState<Partial<UserProfile> | null>(null);
  const [salesData, setSalesData] = useState<SalesDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // default range: 30 hari terakhir
  const today = new Date();
  const defaultEnd = toInputDate(today);
  const d30 = new Date();
  d30.setDate(today.getDate() - 30);
  const defaultStart = toInputDate(d30);

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [fetching, setFetching] = useState(false);

  // ------ Load barista + first fetch ------
  useEffect(() => {
    if (!baristaId) return;
    setLoading(true);

    getBaristaDetails(baristaId).then((data) => {
      setBarista((data as Partial<UserProfile>) ?? null);
    });

    // initial load 30 hari
    const sISO = startOfDayISO(defaultStart);
    const eISO = endOfDayISO(defaultEnd);
    getBaristaSalesDetails(baristaId, sISO, eISO)
      .then((data) => setSalesData(data ?? []))
      .finally(() => setLoading(false));
  }, [baristaId]);

  const applyDateRange = async () => {
    if (!baristaId) return;
    setFetching(true);
    try {
      const sISO = startOfDayISO(startDate);
      const eISO = endOfDayISO(endDate);
      const data = await getBaristaSalesDetails(baristaId, sISO, eISO);
      setSalesData(data ?? []);
    } finally {
      setFetching(false);
    }
  };

  // Quick ranges
  const setQuickRange = (days: number) => {
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

  // ------ Client sort ------
  const sortedData = useMemo(() => {
    const arr = [...salesData];
    arr.sort((a, b) => {
      const A = new Date(a.sale_date).getTime();
      const B = new Date(b.sale_date).getTime();
      return sortOrder === 'asc' ? A - B : B - A;
    });
    return arr;
  }, [salesData, sortOrder]);

  const totalOmset = useMemo(
    () => sortedData.reduce((s, r) => s + (r.total_price || 0), 0),
    [sortedData]
  );

  // ------ Export Excel (mengikuti filter + urutan) ------
  const handleExport = () => {
    const dataToExport: ExcelRow[] = sortedData.map((item) => ({
      Tanggal: new Date(item.sale_date).toLocaleString('id-ID'),
      'Produk Terjual': item.product_name,
      Jumlah: item.quantity_sold,
      'Total (Rp)': item.total_price,
    }));

    dataToExport.push({
      Tanggal: '',
      'Produk Terjual': 'TOTAL OMSET',
      Jumlah: null,
      'Total (Rp)': totalOmset,
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan');

    const fileName = `Laporan_${(barista?.full_name || 'Barista')
      .replace(/\s+/g, '_')
      .trim()}_${startDate}_sd_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (loading) return <div className="p-4 sm:p-6">Memuat data penjualan...</div>;

  return (
    <div className="p-4 sm:p-6">
      <Link
        to="/app/admin/baristas"
        className="text-indigo-600 hover:underline mb-4 inline-flex items-center gap-1"
      >
        &larr; Kembali ke Daftar Barista
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold">
        Laporan Penjualan: {barista?.full_name}
      </h1>
      <p className="text-gray-500 mb-6">Pilih rentang tanggal lalu ekspor ke Excel.</p>

      {/* Controls */}
      <div className="bg-white shadow rounded-lg p-4 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border px-3 py-2 rounded-md"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setQuickRange(7)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
            >
              7 hari
            </button>
            <button
              onClick={() => setQuickRange(30)}
              className="flex-1 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
            >
              30 hari
            </button>
            <button
              onClick={setThisMonth}
              className="hidden lg:block bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-md text-sm"
            >
              Bulan ini
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex-1 bg-gray-200 px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
            >
              Urutkan: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
            </button>
            <button
              onClick={applyDateRange}
              disabled={fetching}
              className="flex-1 bg-indigo-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-60"
            >
              {fetching ? 'Memuat…' : 'Terapkan'}
            </button>
            <button
              onClick={handleExport}
              className="hidden sm:inline-flex bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
            >
              Ekspor ke Excel
            </button>
          </div>
        </div>

        {/* total ringkas (responsive) */}
        <div className="mt-3 text-sm text-gray-700">
          Total Omset: <span className="font-semibold">{fmtIDR(totalOmset)}</span> (
          {new Date(startOfDayISO(startDate)).toLocaleDateString('id-ID')} –{' '}
          {new Date(endOfDayISO(endDate)).toLocaleDateString('id-ID')})
        </div>

        {/* tombol export untuk mobile */}
        <div className="sm:hidden mt-3">
          <button
            onClick={handleExport}
            className="w-full bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
          >
            Ekspor ke Excel
          </button>
        </div>
      </div>

      {/* MOBILE: card list */}
      <div className="sm:hidden space-y-3">
        {sortedData.map((item, idx) => (
          <div key={idx} className="bg-white shadow rounded-lg p-4">
            <div className="text-xs text-gray-500">
              {new Date(item.sale_date).toLocaleString('id-ID')}
            </div>
            <div className="mt-1 font-semibold">{item.product_name}</div>
            <div className="mt-2 flex justify-between text-sm">
              <span>Jumlah: {item.quantity_sold}</span>
              <span>{fmtIDR(item.total_price)}</span>
            </div>
          </div>
        ))}
        {sortedData.length === 0 && (
          <div className="text-center text-gray-500 py-8">Tidak ada data.</div>
        )}
      </div>

      {/* DESKTOP/TABLET: table */}
      <div className="hidden sm:block bg-white shadow-md rounded-lg overflow-x-auto">
        <table className="min-w-[720px] w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Tanggal
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Produk
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Jumlah
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((item, index) => (
              <tr key={index} className="align-top">
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(item.sale_date).toLocaleString('id-ID')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{item.product_name}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.quantity_sold}</td>
                <td className="px-6 py-4 whitespace-nowrap">{fmtIDR(item.total_price)}</td>
              </tr>
            ))}
            {sortedData.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
          {sortedData.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50">
                <td className="px-6 py-3 font-semibold" colSpan={3}>
                  Total Omset
                </td>
                <td className="px-6 py-3 font-semibold">{fmtIDR(totalOmset)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
};

export default BaristaDetailPage;
