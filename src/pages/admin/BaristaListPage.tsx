import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBaristas } from '../../api/adminApi'; // Sesuaikan path jika perlu
import { UserProfile } from '../../types'; // Sesuaikan path jika perlu

const BaristaListPage = () => {
    const [baristas, setBaristas] = useState<Partial<UserProfile>[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getBaristas()
            .then(data => setBaristas(data ?? []))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <div>Loading baristas...</div>;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-6">Kelola Barista</h1>
            <p className="text-gray-600 mb-4">Pilih seorang barista untuk melihat laporan penjualan detail mereka.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {baristas.map(barista => (
                    <Link 
                        to={`/app/admin/baristas/${barista.id}`} 
                        key={barista.id} 
                        className="block p-4 bg-white rounded-lg shadow transition-transform transform hover:-translate-y-1 hover:shadow-lg"
                    >
                        <p className="font-semibold text-lg text-indigo-600">{barista.full_name}</p>
                        <p className="text-sm text-gray-500">{barista.email}</p>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default BaristaListPage;
