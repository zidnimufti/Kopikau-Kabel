import { supabase } from './supabaseClient';

export type Shift = 'Shift 1' | 'Shift 2';

/** Cek apakah barista sudah absen hari ini */
export const getTodayAttendance = async (baristaId: string) => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('barista_id', baristaId)
    .eq('attendance_date', today)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data; // null kalau belum absen hari ini
};

/** Verifikasi PIN lalu catat absen masuk (dipanggil dari halaman verifikasi) */
export const verifyPinAndClockIn = async (
  baristaId: string,
  pin: string,
  shift: Shift
) => {
  // 1. Cek PIN cocok dengan yang tersimpan
  const { data: userRow, error: userError } = await supabase
    .from('users')
    .select('pin_code')
    .eq('id', baristaId)
    .single();

  if (userError) throw new Error(userError.message);
  if (!userRow?.pin_code || userRow.pin_code !== pin) {
    throw new Error('Kode PIN salah. Silakan coba lagi.');
  }

  // 2. Catat absen masuk untuk hari ini
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('attendance')
    .insert([{ barista_id: baristaId, attendance_date: today, shift }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/** Absen pulang: update clock_out pada record absensi hari ini */
export const clockOutToday = async (baristaId: string) => {
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from('attendance')
    .update({ clock_out: new Date().toISOString() })
    .eq('barista_id', baristaId)
    .eq('attendance_date', today)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

/** Untuk halaman admin: riwayat absensi 1 barista */
export const getAttendanceHistory = async (baristaId: string) => {
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('barista_id', baristaId)
    .order('attendance_date', { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
};

/** Admin: set/reset PIN untuk seorang barista */
export const setBaristaPin = async (baristaId: string, pin: string) => {
  if (!/^\d{4,6}$/.test(pin)) {
    throw new Error('PIN harus berupa 4-6 digit angka.');
  }
  const { error } = await supabase
    .from('users')
    .update({ pin_code: pin })
    .eq('id', baristaId);

  if (error) throw new Error(error.message);
  return true;
};

/** Admin: status absensi hari ini untuk SEMUA barista sekaligus (buat list page) */
export const getTodayAttendanceForAll = async () => {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('attendance_date', today);

  if (error) throw new Error(error.message);
  return data || [];
};