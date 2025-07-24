import { useState, useEffect } from 'react';
import { getDashboardSummary } from '../../api/adminApi'; // Sesuaikan path

const StatCard = ({ title, value, icon }: { title: string, value: string, icon: React.ReactNode }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center">
        <div className="bg-indigo-500 text-white p-3 rounded-full mr-4">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </div>
);

const AdminDashboardPage = () => {
    const [summary, setSummary] = useState({ revenue: 0, totalOrders: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDashboardSummary()
            .then(data => setSummary(data))
            .catch(error => console.error("Failed to fetch dashboard summary:", error))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div>Loading dashboard...</div>;
    }

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard 
                    title="Total Revenue" 
                    value={new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(summary.revenue)} 
                    icon={<span>Rp</span>}
                />
                <StatCard 
                    title="Total Orders" 
                    value={summary.totalOrders.toString()} 
                    icon={<span>#</span>}
                />
                {/* Tambahkan kartu statistik lain di sini */}
            </div>
        </div>
    );
};

export default AdminDashboardPage;