// BaristaDetailPage.tsx (versi HeroUI + Kelola PIN & Riwayat Absensi)
import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { getBaristaDetails, getBaristaSalesDetails } from "../../api/adminApi";
import { setBaristaPin, getAttendanceHistory } from "../../api/attandance";
import { UserProfile } from "../../types";
import * as XLSX from "xlsx";
import {
  Button,
  Card,
  CardBody,
  Input,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Chip,
} from "@heroui/react";

// ---------- Types ----------
interface SalesDetail {
  sale_date: string;
  product_name: string;
  quantity_sold: number;
  total_price: number;
}

interface ExcelRow {
  Tanggal: string;
  "Produk Terjual": string;
  Jumlah: number | null;
  "Total (Rp)": number;
}

interface AttendanceRow {
  id: number;
  attendance_date: string;
  shift: string;
  clock_in: string;
  clock_out: string | null;
}

// ---------- Util helpers ----------
const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(n);

const toInputDate = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// ISO untuk awal/akhir hari (pakai zona waktu lokal)
const startOfDayISO = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString();
};

const endOfDayISO = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString();
};

const fmtDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const BaristaDetailPage = () => {
  const { baristaId } = useParams<{ baristaId: string }>();
  const [barista, setBarista] = useState<Partial<UserProfile> | null>(null);
  const [salesData, setSalesData] = useState<SalesDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  // default range: 30 hari terakhir
  const today = new Date();
  const defaultEnd = toInputDate(today);
  const d30 = new Date();
  d30.setDate(today.getDate() - 30);
  const defaultStart = toInputDate(d30);

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);
  const [fetching, setFetching] = useState(false);

  // ===== State untuk PIN =====
  const [pinInput, setPinInput] = useState("");
  const [savingPin, setSavingPin] = useState(false);
  const [pinMessage, setPinMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ===== State untuk riwayat absensi =====
  const [attendanceHistory, setAttendanceHistory] = useState<AttendanceRow[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  // ------ Load barista + first fetch ------
  useEffect(() => {
    if (!baristaId) return;
    setLoading(true);
    getBaristaDetails(baristaId).then((data) => {
      setBarista((data as Partial<UserProfile>) ?? null);
    });

    // initial load 30 hari (laporan penjualan)
    const sISO = startOfDayISO(defaultStart);
    const eISO = endOfDayISO(defaultEnd);
    getBaristaSalesDetails(baristaId, sISO, eISO)
      .then((data) => setSalesData(data ?? []))
      .finally(() => setLoading(false));

    // riwayat absensi
    setLoadingAttendance(true);
    getAttendanceHistory(baristaId)
      .then((data) => setAttendanceHistory(data as AttendanceRow[]))
      .catch((err) => console.error("Gagal ambil riwayat absensi:", err))
      .finally(() => setLoadingAttendance(false));
  }, [baristaId]);

  const applyDateRange = async () => {
    if (!baristaId) return;
    setFetching(true);
    try {
      const sISO = startOfDayISO(startDate);
      const eISO = endOfDayISO(endDate);
      const data = await getBaristaSalesDetails(baristaId, sISO, eISO);
      setSalesData(data ?? []);
    } finally {
      setFetching(false);
    }
  };

  // Quick ranges
  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(toInputDate(start));
    setEndDate(toInputDate(end));
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    setStartDate(toInputDate(start));
    setEndDate(toInputDate(now));
  };

  // ------ Client sort ------
  const sortedData = useMemo(() => {
    const arr = [...salesData];
    arr.sort((a, b) => {
      const A = new Date(a.sale_date).getTime();
      const B = new Date(b.sale_date).getTime();
      return sortOrder === "asc" ? A - B : B - A;
    });
    return arr;
  }, [salesData, sortOrder]);

  const totalOmset = useMemo(
    () => sortedData.reduce((s, r) => s + (r.total_price || 0), 0),
    [sortedData]
  );

  // ------ Export Excel (mengikuti filter + urutan) ------
  const handleExport = () => {
    const dataToExport: ExcelRow[] = sortedData.map((item) => ({
      Tanggal: new Date(item.sale_date).toLocaleString("id-ID"),
      "Produk Terjual": item.product_name,
      Jumlah: item.quantity_sold,
      "Total (Rp)": item.total_price,
    }));

    dataToExport.push({
      Tanggal: "",
      "Produk Terjual": "TOTAL OMSET",
      Jumlah: null,
      "Total (Rp)": totalOmset,
    });

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Laporan Penjualan");

    const fileName = `Laporan_${(barista?.full_name || "Barista")
      .replace(/\s+/g, "_")
      .trim()}_${startDate}_sd_${endDate}.xlsx`;

    XLSX.writeFile(wb, fileName);
  };

  // ------ Simpan PIN ------
  const handleSavePin = async () => {
    if (!baristaId) return;
    setPinMessage(null);

    if (!/^\d{4,6}$/.test(pinInput)) {
      setPinMessage({ type: "error", text: "PIN harus 4-6 digit angka." });
      return;
    }

    setSavingPin(true);
    try {
      await setBaristaPin(baristaId, pinInput);
      setPinMessage({ type: "success", text: "PIN berhasil disimpan." });
      setPinInput("");
    } catch (err: any) {
      setPinMessage({ type: "error", text: err.message || "Gagal menyimpan PIN." });
    } finally {
      setSavingPin(false);
    }
  };

  if (loading)
    return (
      <div className="p-6 flex items-center gap-3">
        <Spinner size="sm" /> Memuat data penjualan...
      </div>
    );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <Button
        as={Link}
        to="/app/admin/baristas"
        variant="light"
        className="mb-1 w-fit"
      >
        ← Kembali ke Daftar Barista
      </Button>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Detail Barista: {barista?.full_name}
          </h1>
          <p className="text-default-500">
            Kelola PIN absensi, lihat riwayat absen, dan laporan penjualan.
          </p>
        </div>
      </div>

      {/* ===== Kelola PIN Absensi ===== */}
      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold">Kelola PIN Absensi</h2>
          <p className="text-sm text-default-500">
            PIN ini dipakai barista untuk verifikasi absen masuk. Isi untuk mengatur PIN baru
            (menimpa PIN lama jika sudah ada).
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
            <Input
              type="text"
              inputMode="numeric"
              maxLength={6}
              label="PIN baru (4-6 digit)"
              placeholder="misal: 1234"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
              className="sm:max-w-xs"
            />
            <Button
              color="primary"
              isLoading={savingPin}
              isDisabled={!pinInput}
              onPress={handleSavePin}
            >
              Simpan PIN
            </Button>
          </div>
          {pinMessage && (
            <p className={pinMessage.type === "success" ? "text-success text-sm" : "text-danger text-sm"}>
              {pinMessage.text}
            </p>
          )}
        </CardBody>
      </Card>

      {/* ===== Riwayat Absensi ===== */}
      <Card>
        <CardBody className="space-y-3">
          <h2 className="text-lg font-semibold">Riwayat Absensi</h2>
          {loadingAttendance ? (
            <div className="flex items-center gap-2 text-default-500">
              <Spinner size="sm" /> Memuat riwayat absensi...
            </div>
          ) : attendanceHistory.length === 0 ? (
            <div className="text-default-500 text-sm">Belum ada riwayat absensi.</div>
          ) : (
            <Table aria-label="Riwayat absensi barista" removeWrapper>
              <TableHeader>
                <TableColumn>Tanggal</TableColumn>
                <TableColumn>Shift</TableColumn>
                <TableColumn>Jam Masuk</TableColumn>
                <TableColumn>Jam Pulang</TableColumn>
              </TableHeader>
              <TableBody items={attendanceHistory}>
                {(row: AttendanceRow) => (
                  <TableRow key={row.id}>
                    <TableCell>{fmtDate(row.attendance_date)}</TableCell>
                    <TableCell>{row.shift}</TableCell>
                    <TableCell>{fmtTime(row.clock_in)}</TableCell>
                    <TableCell>
                      {row.clock_out ? (
                        fmtTime(row.clock_out)
                      ) : (
                        <Chip size="sm" variant="flat" color="warning">
                          Belum pulang
                        </Chip>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* ===== Laporan Penjualan (bagian lama, tidak berubah) ===== */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Laporan Penjualan
          </h2>
          <p className="text-default-500">
            Pilih rentang tanggal lalu ekspor ke Excel.
          </p>
        </div>
        <Button
          color="success"
          onPress={handleExport}
          className="hidden sm:inline-flex"
        >
          Ekspor ke Excel
        </Button>
      </div>

      {/* Controls */}
      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <Input
              type="date"
              label="Tanggal Mulai"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              type="date"
              label="Tanggal Selesai"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <div className="flex gap-2">
              <Button variant="flat" className="flex-1" onPress={() => setQuickRange(7)}>
                7 hari
              </Button>
              <Button variant="flat" className="flex-1" onPress={() => setQuickRange(30)}>
                30 hari
              </Button>
              <Button
                variant="flat"
                className="hidden lg:flex"
                onPress={setThisMonth}
              >
                Bulan ini
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                variant="bordered"
                className="flex-1"
                onPress={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              >
                Urutkan: {sortOrder === "desc" ? "Terbaru" : "Terlama"}
              </Button>
              <Button
                color="primary"
                className="flex-1"
                onPress={applyDateRange}
                isLoading={fetching}
                isDisabled={fetching}
              >
                Terapkan
              </Button>
            </div>
          </div>

          {/* total ringkas (responsive) */}
          <div className="text-sm text-default-700">
            Total Omset:{" "}
            <span className="font-semibold">{fmtIDR(totalOmset)}</span> (
            {new Date(startOfDayISO(startDate)).toLocaleDateString("id-ID")} –{" "}
            {new Date(endOfDayISO(endDate)).toLocaleDateString("id-ID")})
          </div>

          {/* tombol export untuk mobile */}
          <Button color="success" className="sm:hidden w-full" onPress={handleExport}>
            Ekspor ke Excel
          </Button>
        </CardBody>
      </Card>

      {/* MOBILE: card list */}
      <div className="sm:hidden space-y-3">
        {sortedData.map((item, idx) => (
          <Card key={idx}>
            <CardBody className="space-y-2">
              <div className="text-xs text-default-500">
                {new Date(item.sale_date).toLocaleString("id-ID")}
              </div>
              <div className="font-semibold">{item.product_name}</div>
              <div className="flex justify-between text-sm">
                <span>Jumlah: {item.quantity_sold}</span>
                <span>{fmtIDR(item.total_price)}</span>
              </div>
            </CardBody>
          </Card>
        ))}
        {sortedData.length === 0 && (
          <div className="text-center text-default-500 py-8">Tidak ada data.</div>
        )}
      </div>

      {/* DESKTOP/TABLET: table */}
      <Card className="hidden sm:block">
        <CardBody>
          <Table aria-label="Tabel penjualan barista" removeWrapper>
            <TableHeader>
              <TableColumn>Tanggal</TableColumn>
              <TableColumn>Produk</TableColumn>
              <TableColumn>Jumlah</TableColumn>
              <TableColumn>Total</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Tidak ada data." items={sortedData}>
              {(item: SalesDetail) => (
                <TableRow key={`${item.sale_date}-${item.product_name}`}>
                  <TableCell>
                    {new Date(item.sale_date).toLocaleString("id-ID")}
                  </TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.quantity_sold}</TableCell>
                  <TableCell>{fmtIDR(item.total_price)}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {sortedData.length > 0 && (
            <div className="mt-4 flex justify-end text-sm">
              <div className="font-semibold">
                Total Omset: {fmtIDR(totalOmset)}
              </div>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default BaristaDetailPage;