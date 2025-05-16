import qrisDynamicGenerator from "qris-dynamic-generator";

// letakkan STATIC_QRIS merchant-mu di sini
const STATIC_QRIS =
  "00020101021126580013ID.CO.BRI.WWW01189360000200406440380208406440380303UMI51440014ID.CO.QRIS.WWW0215ID10232829189460303UMI5204581453033605802ID5912KANTIN K@BEL6007CILEGON61054244162070703A016304A25A";

// inisialisasi generator
const QRIS =new qrisDynamicGenerator(STATIC_QRIS);

export async function generateQrisBase64(amount: number, size = 300): Promise<string> {
  return QRIS.generateBase64(amount, size);
}
