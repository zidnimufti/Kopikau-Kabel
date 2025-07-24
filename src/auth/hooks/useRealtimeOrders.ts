// --- FILE 2 (GANTI): src/hooks/useRealtimeOrders.ts ---
// Deskripsi: Ditulis ulang untuk menggunakan realtimeService yang baru.
//            Kodenya sekarang jauh lebih bersih dan lebih andal.

import { useState, useEffect, useCallback } from 'react';
import { getPendingOrders } from '@/api/orderApi'; // Sesuaikan path
import { Order } from '@/types'; // Sesuaikan path
import { realtimeService } from '@/api/realtimeService'; // <-- IMPORT LAYANAN BARU

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
