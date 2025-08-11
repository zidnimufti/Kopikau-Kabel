import qrisDynamicGenerator from "qris-dynamic-generator";

const QRIS_URL = import.meta.env.VITE_QRIS_URL;

// inisialisasi generator
const QRIS = new qrisDynamicGenerator(QRIS_URL);

export async function generateQrisBase64(amount: number, size = 300): Promise<string> {
  return QRIS.generateBase64(amount, size);
}
