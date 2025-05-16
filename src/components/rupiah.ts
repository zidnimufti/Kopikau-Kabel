// src/utils/currency.ts

/**
 * Format number ke string Rupiah, misal 15000 → "Rp15.000"
 */
export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

/**
 * Parse string Rupiah (misal "Rp15.000") kembali ke number 15000
 */
export function parseRupiah(rupiah: string): number {
  // 1) Hilangkan semua karakter kecuali digit dan tanda minus
  const onlyNumbers = rupiah.replace(/[^0-9-]/g, "");
  // 2) Konversi ke number
  return parseInt(onlyNumbers, 10);
}
