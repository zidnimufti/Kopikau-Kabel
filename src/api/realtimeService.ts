// --- FILE 1 (BUAT BARU/GANTI): src/lib/realtimeService.ts ---
// Deskripsi: Layanan Singleton ini menjadi satu-satunya pengelola koneksi
//            real-time untuk seluruh aplikasi, menghilangkan semua race condition.

import { supabase } from '../api/supabaseClient'; // Sesuaikan path

class RealtimeService {
    private channel;
    private callbacks = new Set<() => void>();
    private isSubscribed = false;

    constructor() {
        // Buat SATU channel yang konsisten untuk seluruh aplikasi.
        this.channel = supabase.channel('orders-channel', {
            config: {
                broadcast: { self: true }, // Pastikan pengirim juga menerima sinyal
            },
        });
        this.ensureSubscribed();
    }

    private handleBroadcast = (payload: any) => {
        console.log('[Service] Sinyal broadcast diterima!', payload);
        // Panggil semua fungsi callback yang terdaftar
        this.callbacks.forEach(callback => callback());
    };

    private ensureSubscribed = () => {
        // Cegah langganan ganda
        if (this.isSubscribed) {
            return;
        }
        
        this.channel
            .on('broadcast', { event: 'orders_updated' }, this.handleBroadcast)
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Service] Berhasil terhubung ke channel real-time!');
                    this.isSubscribed = true;
                    // Panggil semua callback sekali saat berhasil terhubung untuk sinkronisasi awal
                    this.callbacks.forEach(callback => callback());
                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error(`[Service] Koneksi real-time gagal: ${status}`);
                    this.isSubscribed = false; // Izinkan percobaan ulang pada subscribe berikutnya
                }
            });
    };

    // Fungsi untuk komponen (seperti hook) untuk mulai mendengarkan
    public subscribe = (callback: () => void) => {
        this.callbacks.add(callback);
        
        // Panggil callback jika sudah terhubung, untuk data awal
        if (this.isSubscribed) {
            callback();
        }

        // Kembalikan fungsi cleanup yang spesifik
        return () => {
            console.log('[Service] Komponen berhenti berlangganan.');
            this.callbacks.delete(callback);
        };
    };

    // Fungsi untuk mengirim sinyal pembaruan
    public broadcast = async () => {
        try {
            if (!this.isSubscribed) {
                console.warn("[Service] Mencoba broadcast sebelum channel terhubung.");
                return;
            }
            const status = await this.channel.send({
                type: 'broadcast',
                event: 'orders_updated',
            });
            console.log("[Service] Broadcast send status:", status);
        } catch (error) {
            console.error('[Service] Gagal mengirim broadcast:', error);
        }
    };
}

// Ekspor SATU instance dari service. Ini adalah kunci dari pola Singleton.
export const realtimeService = new RealtimeService();
