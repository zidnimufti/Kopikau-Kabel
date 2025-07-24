// --- FILE 1 (GANTI): src/lib/realtimeService.ts ---
// Deskripsi: Diperbarui untuk mengaktifkan "self-broadcast",
//            memastikan tab yang mengirim pembaruan juga menerimanya.

import { supabase } from '../api/supabaseClient'; // Sesuaikan path

class RealtimeService {
    private channel;
    private callbacks = new Set<() => void>();
    private isSubscribed = false;

    constructor() {
        // FIX: Tambahkan konfigurasi `self: true` pada broadcast
        // untuk memastikan pengirim juga menerima sinyalnya sendiri.
        this.channel = supabase.channel('orders-channel', {
            config: {
                broadcast: {
                    self: true,
                },
            },
        });
        this.ensureSubscribed();
    }

    private handleBroadcast = (payload: any) => {
        console.log('Sinyal broadcast diterima oleh service!', payload);
        this.callbacks.forEach(callback => callback());
    };

    private ensureSubscribed = () => {
        if (this.isSubscribed) {
            return;
        }
        
        this.channel
            .on('broadcast', { event: 'orders_updated' }, this.handleBroadcast)
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Berhasil terhubung ke channel real-time!');
                    this.isSubscribed = true;
                    this.callbacks.forEach(callback => callback());
                }
                if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
                    console.error(`Koneksi real-time gagal: ${status}`);
                }
            });
    };

    public subscribe = (callback: () => void) => {
        this.callbacks.add(callback);
        if (this.isSubscribed) {
            callback();
        }
        return () => {
            console.log('Berhenti berlangganan dari pembaruan channel.');
            this.callbacks.delete(callback);
        };
    };

    public broadcast = async () => {
        try {
            const status = await this.channel.send({
                type: 'broadcast',
                event: 'orders_updated',
            });
            console.log("Broadcast send status:", status);
        } catch (error) {
            console.error('Gagal mengirim broadcast:', error);
        }
    };
}

export const realtimeService = new RealtimeService();