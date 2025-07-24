import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBaristaDetails, getBaristaSalesDetails } from '../../api/adminApi';
import { UserProfile } from '../../types';
import * as XLSX from 'xlsx'; // Import library xlsx

// Tipe data untuk setiap baris dalam laporan
interface SalesDetail {
    sale_date: string;
    product_name: string;
    quantity_sold: number;
    total_price: number;
}

// Tipe data untuk baris yang akan diekspor ke Excel
interface ExcelRow {
    'Tanggal': string;
    'Produk Terjual': string;
    'Jumlah': number | null; // Izinkan null untuk baris total
    'Total (Rp)': number;
}

const BaristaDetailPage = () => {
    const { baristaId } = useParams<{ baristaId: string }>();
    const [barista, setBarista] = useState<Partial<UserProfile> | null>(null);
    const [salesData, setSalesData] = useState<SalesDetail[]>([]);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // 'desc' = terbaru dulu
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!baristaId) return;

        setLoading(true);
        
        // FIX: Mengubah cara kita memanggil setBarista agar aman secara tipe data.
        getBaristaDetails(baristaId).then(data => {
            setBarista(data as Partial<UserProfile> | null);
        });

        // Ambil data penjualan 30 hari terakhir
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - 30);

        getBaristaSalesDetails(baristaId, startDate.toISOString(), endDate.toISOString())
            .then(data => setSalesData(data ?? []))
            .finally(() => setLoading(false));

    }, [baristaId]);

    // Gunakan useMemo untuk mengurutkan data di sisi client tanpa perlu fetch ulang
    const sortedData = useMemo(() => {
        const sorted = [...salesData];
        sorted.sort((a, b) => {
            const dateA = new Date(a.sale_date).getTime();
            const dateB = new Date(b.sale_date).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });
        return sorted;
    }, [salesData, sortOrder]);

    const handleExport = () => {
        // 1. Siapkan data untuk diekspor dengan tipe yang eksplisit
        const dataToExport: ExcelRow[] = sortedData.map(item => ({
            'Tanggal': new Date(item.sale_date).toLocaleString('id-ID'),
            'Produk Terjual': item.product_name,
            'Jumlah': item.quantity_sold,
            'Total (Rp)': item.total_price
        }));

        // 2. Hitung total omset
        const totalOmset = sortedData.reduce((sum, item) => sum + item.total_price, 0);
        dataToExport.push({
            'Tanggal': '',
            'Produk Terjual': 'TOTAL OMSET',
            'Jumlah': null,
            'Total (Rp)': totalOmset
        });

        // 3. Buat worksheet dan workbook menggunakan xlsx
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penjualan");

        // 4. Buat nama file dan unduh
        const fileName = `Laporan_${barista?.full_name?.replace(' ', '_')}_${new Date().toLocaleDateString('id-ID')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
    };

    if (loading) return <div>Loading data penjualan...</div>;

    return (
        <div>
            <Link to="/app/admin/baristas" className="text-indigo-600 hover:underline mb-4 block">&larr; Kembali ke Daftar Barista</Link>
            <h1 className="text-3xl font-bold">Laporan Penjualan: {barista?.full_name}</h1>
            <p className="text-gray-500 mb-6">Menampilkan data 30 hari terakhir</p>

            <div className="flex gap-4 mb-4">
                <button 
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    className="bg-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300"
                >
                    Urutkan: {sortOrder === 'desc' ? 'Terbaru' : 'Terlama'}
                </button>
                <button 
                    onClick={handleExport}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                    Ekspor ke Excel
                </button>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedData.map((item, index) => (
                            <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap">{new Date(item.sale_date).toLocaleString('id-ID')}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.product_name}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{item.quantity_sold}</td>
                                <td className="px-6 py-4 whitespace-nowrap">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.total_price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default BaristaDetailPage;
