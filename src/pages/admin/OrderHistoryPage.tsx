// --- FILE: src/pages/admin/OrderHistoryPage.tsx (HeroUI, mobile-first) ---
import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { getAllOrders, deleteOrder } from "../../api/adminApi";

import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Spinner,
  Tabs,
  Tab,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
} from "@heroui/react";

// ===== Types =====
interface DetailedOrder {
  order_id: number;
  created_at: string;
  customer_name: string;
  total_amount: number;
  status: "pending" | "completed" | "cancelled";
  barista_name: string;
  payment_method?: "cash" | "qris" | null;
  items: { product_name: string; quantity: number; subtotal: number }[];
}
type StatusFilter = "all" | "completed" | "pending" | "cancelled";

interface ExcelItemRow {
  Tanggal: string;
  Pelanggan: string;
  Barista: string;
  Produk: string;
  Jumlah: number;
  "Harga/Item (Rp)": number;
  "Subtotal (Rp)": number;
  Metode: string;
}
interface GroupRow { key: string; qty: number; total: number; lastAt?: number; }
interface GroupBPRow { barista: string; product: string; qty: number; total: number; }

// ===== Utils =====
const fmtIDR = (n: number) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);
const toInputDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const startOfDay = (s: string) => { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d,0,0,0,0).getTime(); };
const endOfDay   = (s: string) => { const [y,m,d] = s.split("-").map(Number); return new Date(y,m-1,d,23,59,59,999).getTime(); };

type ViewTab = "orders" | "produk" | "barista" | "baristaProduk";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<DetailedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  const today = new Date();
  const defaultEnd = toInputDate(today);
  const d30 = new Date(); d30.setDate(today.getDate() - 30);
  const defaultStart = toInputDate(d30);

  const [startDate, setStartDate] = useState<string>(defaultStart);
  const [endDate, setEndDate] = useState<string>(defaultEnd);

  const [selectedOrder, setSelectedOrder] = useState<DetailedOrder | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [tab, setTab] = useState<ViewTab>("orders");

  useEffect(() => {
    setLoading(true);
    getAllOrders().then(data => setOrders(data ?? [])).finally(() => setLoading(false));
  }, []);

  // quick ranges
  const quick = (days: number) => { const end = new Date(); const start = new Date(); start.setDate(end.getDate() - days); setStartDate(toInputDate(start)); setEndDate(toInputDate(end)); };
  const thisMonth = () => { const now = new Date(); const start = new Date(now.getFullYear(), now.getMonth(), 1); setStartDate(toInputDate(start)); setEndDate(toInputDate(now)); };

  const sMs = useMemo(() => startOfDay(startDate), [startDate]);
  const eMs = useMemo(() => endOfDay(endDate), [endDate]);

  const filteredOrders = useMemo(
    () => orders.filter((o) => {
      const t = new Date(o.created_at).getTime();
      const inRange = t >= sMs && t <= eMs;
      const statusOk = filter === "all" ? true : o.status === filter;
      return inRange && statusOk;
    }),
    [orders, filter, sMs, eMs]
  );

  // Flatten items (completed only)
  const completedRows = useMemo(() => {
    const rows: { created_at: string; customer_name: string; barista_name: string; product_name: string; quantity: number; subtotal: number; payment_method?: "cash"|"qris"|null; }[] = [];
    orders.forEach((o) => {
      const t = new Date(o.created_at).getTime();
      if (o.status !== "completed" || t < sMs || t > eMs) return;
      (o.items || []).forEach((it) => rows.push({
        created_at: o.created_at, customer_name: o.customer_name, barista_name: o.barista_name,
        product_name: it.product_name, quantity: it.quantity, subtotal: it.subtotal,
        payment_method: o.payment_method ?? null,
      }));
    });
    return rows;
  }, [orders, sMs, eMs]);

  const totalOmsetCompleted = useMemo(() => completedRows.reduce((s, r) => s + (r.subtotal || 0), 0), [completedRows]);

  // Rekap
  const rekapProduk: GroupRow[] = useMemo(() => {
    const map = new Map<string, { qty: number; total: number; lastAt: number }>();
    completedRows.forEach((r) => {
      const cur = map.get(r.product_name) || { qty: 0, total: 0, lastAt: 0 };
      cur.qty += r.quantity || 0; cur.total += r.subtotal || 0;
      const t = new Date(r.created_at).getTime(); if (t > cur.lastAt) cur.lastAt = t;
      map.set(r.product_name, cur);
    });
    return Array.from(map.entries()).map(([key, v]) => ({ key, qty: v.qty, total: v.total, lastAt: v.lastAt })).sort((a,b)=>b.total-a.total);
  }, [completedRows]);

  const rekapBarista: GroupRow[] = useMemo(() => {
    const map = new Map<string, { qty: number; total: number }>();
    completedRows.forEach((r) => {
      const key = r.barista_name || "—";
      const cur = map.get(key) || { qty: 0, total: 0 };
      cur.qty += r.quantity || 0; cur.total += r.subtotal || 0;
      map.set(key, cur);
    });
    return Array.from(map.entries()).map(([key, v]) => ({ key, qty: v.qty, total: v.total })).sort((a,b)=>b.total-a.total);
  }, [completedRows]);

  const rekapBaristaProduk: GroupBPRow[] = useMemo(() => {
    const map = new Map<string, { qty: number; total: number }>();
    completedRows.forEach((r) => {
      const key = `${r.barista_name || "—"}@@${r.product_name}`;
      const cur = map.get(key) || { qty: 0, total: 0 };
      cur.qty += r.quantity || 0; cur.total += r.subtotal || 0;
      map.set(key, cur);
    });
    return Array.from(map.entries()).map(([k,v]) => {
      const [barista, product] = k.split("@@");
      return { barista, product, qty: v.qty, total: v.total };
    }).sort((a,b)=>b.total-a.total);
  }, [completedRows]);

  // Exporters
  const exportDetailItem = () => {
    if (completedRows.length === 0) return alert("Tidak ada transaksi COMPLETED pada rentang ini.");
    const rows: ExcelItemRow[] = completedRows.map((r) => ({
      Tanggal: new Date(r.created_at).toLocaleString("id-ID"),
      Pelanggan: r.customer_name,
      Barista: r.barista_name,
      Produk: r.product_name,
      Jumlah: r.quantity,
      "Harga/Item (Rp)": r.quantity ? r.subtotal / r.quantity : 0,
      "Subtotal (Rp)": r.subtotal,
      Metode: (r.payment_method || "").toUpperCase(),
    }));
    rows.push({ Tanggal:"", Pelanggan:"TOTAL OMSET", Barista:"", Produk:"", Jumlah:0, "Harga/Item (Rp)":0, "Subtotal (Rp)": totalOmsetCompleted, Metode:"" });
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Detail Item (Completed)");
    XLSX.writeFile(wb, `Detail_Item_Completed_${startDate}_sd_${endDate}.xlsx`);
  };
  const exportRekapProduk = () => {
    if (rekapProduk.length === 0) return alert("Tidak ada data rekap Produk pada rentang ini.");
    const rows = rekapProduk.map((r) => ({ Tanggal: r.lastAt ? new Date(r.lastAt).toLocaleDateString("id-ID") : "", Produk: r.key, Jumlah: r.qty, "Total (Rp)": r.total }));
    rows.push({ Tanggal:"", Produk:"TOTAL", Jumlah: rekapProduk.reduce((s,r)=>s+r.qty,0), "Total (Rp)": rekapProduk.reduce((s,r)=>s+r.total,0) });
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Produk");
    XLSX.writeFile(wb, `Rekap_Produk_${startDate}_sd_${endDate}.xlsx`);
  };
  const exportRekapBarista = () => {
    if (rekapBarista.length === 0) return alert("Tidak ada data rekap Barista pada rentang ini.");
    const rows = rekapBarista.map((r) => ({ Barista: r.key, "Jumlah Item": r.qty, "Total (Rp)": r.total }));
    rows.push({ Barista:"TOTAL", "Jumlah Item": rekapBarista.reduce((s,r)=>s+r.qty,0), "Total (Rp)": rekapBarista.reduce((s,r)=>s+r.total,0) });
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Barista");
    XLSX.writeFile(wb, `Rekap_Barista_${startDate}_sd_${endDate}.xlsx`);
  };
  const exportBaristaProduk = () => {
    if (rekapBaristaProduk.length === 0) return alert("Tidak ada data Barista × Produk pada rentang ini.");
    const rows = rekapBaristaProduk.map((r)=>({ Barista:r.barista, Produk:r.product, Jumlah:r.qty, "Total (Rp)":r.total }));
    const ws = XLSX.utils.json_to_sheet(rows); const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Barista x Produk");
    XLSX.writeFile(wb, `Barista_x_Produk_${startDate}_sd_${endDate}.xlsx`);
  };

  // Delete
  const handleDelete = async (id: number) => {
    if (!window.confirm("Hapus order ini secara permanen?")) return;
    setDeletingId(id);
    try {
      await deleteOrder(id);
      setOrders(prev => prev.filter(o => o.order_id !== id));
      if (selectedOrder?.order_id === id) setSelectedOrder(null);
    } finally { setDeletingId(null); }
  };

  if (loading) return (<div className="p-6 flex items-center gap-2"><Spinner size="sm" /> Memuat…</div>);

  return (
    // NOTE: cegah “geser samping” kecil di mobile
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 overflow-x-hidden">
      <h1 className="text-2xl md:text-3xl font-bold">Riwayat & Ringkasan Penjualan</h1>

      {/* Filter panel */}
      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
            {/* Status */}
            <div className="min-w-0">
              <div className="text-xs font-medium text-default-600 mb-1">Status (tampilan Orders)</div>
              {/* NOTE: bisa di-swipe saat sempit */}
              <div className="flex flex-nowrap gap-2 overflow-x-auto -mx-1 px-1">
                {(["all","completed","pending","cancelled"] as const).map((s)=>(
                  <Button
                    key={s}
                    size="sm"
                    variant={filter===s?"solid":"flat"}
                    color={filter===s?"primary":"default"}
                    onPress={()=>setFilter(s)}
                    className="capitalize shrink-0"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>

            {/* Date pickers */}
            <div className="min-w-0">
              <Input
                size="sm"
                type="date"
                label="Tanggal Mulai"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full max-w-full"
              />
            </div>
            <div className="min-w-0">
              <Input
                size="sm"
                type="date"
                label="Tanggal Selesai"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full max-w-full"
              />
            </div>

            {/* Quick buttons */}
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button variant="flat" className="w-full" onPress={() => quick(7)}>7 hari</Button>
              <Button variant="flat" className="w-full" onPress={() => quick(30)}>30 hari</Button>
              <Button variant="flat" className="col-span-2 hidden lg:inline-flex" onPress={thisMonth}>Bulan ini</Button>
            </div>
          </div>

          <div className="text-sm text-default-700">
            Completed (item) dalam rentang: <span className="font-semibold">{completedRows.length}</span> baris •
            Total Omset: <span className="font-semibold">{fmtIDR(totalOmsetCompleted)}</span>
          </div>
        </CardBody>
      </Card>

      {/* Tabs + Export row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* NOTE: Tabs bisa swipe */}
        <div className="overflow-x-auto w-full">
          <Tabs
            selectedKey={tab}
            onSelectionChange={(k) => setTab(k as ViewTab)}
            aria-label="Tampilan data"
            className="w-max"
          >
            <Tab key="orders" title="Orders" />
            <Tab key="produk" title="Rekap Produk" />
            <Tab key="barista" title="Rekap Barista" />
            <Tab key="baristaProduk" title="Barista × Produk" />
          </Tabs>
        </div>

        {/* NOTE: tombol export full-width di mobile */}
        <div className="w-full sm:w-auto sm:ml-auto grid grid-cols-1 gap-2 sm:auto-cols-max sm:grid-flow-col">
          <Button className="w-full sm:w-auto" color="success" onPress={exportDetailItem}>
            Ekspor Excel — Detail Per Item
          </Button>
          {tab === "produk" && (
            <Button className="w-full sm:w-auto" color="primary" onPress={exportRekapProduk}>
              Ekspor Rekap Produk
            </Button>
          )}
          {tab === "barista" && (
            <Button className="w-full sm:w-auto" color="primary" onPress={exportRekapBarista}>
              Ekspor Rekap Barista
            </Button>
          )}
          {tab === "baristaProduk" && (
            <Button className="w-full sm:w-auto" color="primary" onPress={exportBaristaProduk}>
              Ekspor Barista × Produk
            </Button>
          )}
        </div>
      </div>

      {/* CONTENT */}
      {tab === "orders" && (
        <>
          {/* MOBILE: Card list */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => (
              <Card key={order.order_id} shadow="sm" className="text-left">
                <CardBody className="space-y-2">
                  <div className="text-xs text-default-500">{new Date(order.created_at).toLocaleString("id-ID")}</div>
                  <div className="font-semibold break-words">{order.customer_name}</div>
                  <div className="text-sm text-default-600">Barista: {order.barista_name}</div>
                  <div className="flex flex-wrap gap-2">
                    <Chip size="sm" variant="flat" color={order.status==="completed"?"success":order.status==="pending"?"warning":"danger"}>{order.status}</Chip>
                    <Chip size="sm" variant="flat" color={order.payment_method==="cash"?"secondary":order.payment_method==="qris"?"primary":"default"}>
                      {(order.payment_method || "—").toString().toUpperCase()}
                    </Chip>
                  </div>
                  <div className="font-medium">{fmtIDR(order.total_amount)}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="flat" onPress={() => setSelectedOrder(order)}>Lihat Detail</Button>
                    <Button size="sm" color="danger" variant="light" isLoading={deletingId===order.order_id} onPress={() => handleDelete(order.order_id)}>
                      {deletingId===order.order_id ? "Menghapus…" : "Hapus"}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
            {filteredOrders.length === 0 && (
              <Card><CardBody className="text-center text-default-500">Tidak ada order.</CardBody></Card>
            )}
          </div>

          {/* ≥ md: Table */}
          <Card className="hidden md:block">
            <CardBody className="overflow-x-auto">
              <Table aria-label="Tabel orders" removeWrapper>
                <TableHeader>
                  <TableColumn>Tanggal</TableColumn>
                  <TableColumn>Pelanggan</TableColumn>
                  <TableColumn className="hidden md:table-cell">Barista</TableColumn>
                  <TableColumn className="hidden lg:table-cell">Metode</TableColumn>
                  <TableColumn>Total</TableColumn>
                  <TableColumn>Status</TableColumn>
                  <TableColumn className="hidden md:table-cell">Aksi</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Tidak ada order." items={filteredOrders}>
                  {(order: DetailedOrder) => (
                    <TableRow key={order.order_id}>
                      <TableCell>{new Date(order.created_at).toLocaleString("id-ID")}</TableCell>
                      <TableCell className="break-words">{order.customer_name}</TableCell>
                      <TableCell className="hidden md:table-cell">{order.barista_name}</TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Chip size="sm" variant="flat" color={order.payment_method==="cash"?"secondary":order.payment_method==="qris"?"primary":"default"}>
                          {(order.payment_method || "—")?.toString().toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>{fmtIDR(order.total_amount)}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat" color={order.status==="completed"?"success":order.status==="pending"?"warning":"danger"}>{order.status}</Chip>
                      </TableCell>
                      <TableCell className="hidden md:table-cell space-x-2">
                        <Button size="sm" variant="flat" onPress={() => setSelectedOrder(order)}>Lihat Detail</Button>
                        <Button size="sm" color="danger" variant="light" isLoading={deletingId===order.order_id} onPress={() => handleDelete(order.order_id)}>
                          {deletingId===order.order_id ? "Menghapus…" : "Hapus"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardBody>
          </Card>
        </>
      )}

      {/* Rekap Produk */}
      {tab === "produk" && (
        <Card>
          <CardBody className="overflow-x-auto">
            <Table aria-label="Rekap Produk" removeWrapper>
              <TableHeader>
                <TableColumn>Tanggal</TableColumn>
                <TableColumn>Produk</TableColumn>
                <TableColumn className="text-right">Jumlah</TableColumn>
                <TableColumn className="text-right">Total</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Tidak ada data." items={rekapProduk}>
                {(r: GroupRow) => (
                  <TableRow key={r.key}>
                    <TableCell>{r.lastAt ? new Date(r.lastAt).toLocaleDateString("id-ID") : "-"}</TableCell>
                    <TableCell>{r.key}</TableCell>
                    <TableCell className="text-right">{r.qty}</TableCell>
                    <TableCell className="text-right">{fmtIDR(r.total)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {rekapProduk.length > 0 && (
              <div className="mt-4 flex justify-end text-sm font-semibold">
                <div className="space-x-8">
                  <span>TOTAL Qty: {rekapProduk.reduce((s,r)=>s+r.qty,0).toLocaleString()}</span>
                  <span>TOTAL: {fmtIDR(rekapProduk.reduce((s,r)=>s+r.total,0))}</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Rekap Barista */}
      {tab === "barista" && (
        <Card>
          <CardBody className="overflow-x-auto">
            <Table aria-label="Rekap Barista" removeWrapper>
              <TableHeader>
                <TableColumn>Barista</TableColumn>
                <TableColumn className="text-right">Jumlah Item</TableColumn>
                <TableColumn className="text-right">Total</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Tidak ada data." items={rekapBarista}>
                {(r: GroupRow) => (
                  <TableRow key={r.key}>
                    <TableCell>{r.key}</TableCell>
                    <TableCell className="text-right">{r.qty}</TableCell>
                    <TableCell className="text-right">{fmtIDR(r.total)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {rekapBarista.length > 0 && (
              <div className="mt-4 flex justify-end text-sm font-semibold">
                <div className="space-x-8">
                  <span>TOTAL Qty: {rekapBarista.reduce((s,r)=>s+r.qty,0).toLocaleString()}</span>
                  <span>TOTAL: {fmtIDR(rekapBarista.reduce((s,r)=>s+r.total,0))}</span>
                </div>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {/* Barista × Produk */}
      {tab === "baristaProduk" && (
        <Card>
          <CardBody className="overflow-x-auto">
            <Table aria-label="Barista × Produk" removeWrapper>
              <TableHeader>
                <TableColumn>Barista</TableColumn>
                <TableColumn>Produk</TableColumn>
                <TableColumn className="text-right">Jumlah</TableColumn>
                <TableColumn className="text-right">Total</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Tidak ada data." items={rekapBaristaProduk}>
                {(r: GroupBPRow) => (
                  <TableRow key={`${r.barista}-${r.product}-${r.qty}-${r.total}`}>
                    <TableCell>{r.barista}</TableCell>
                    <TableCell>{r.product}</TableCell>
                    <TableCell className="text-right">{r.qty}</TableCell>
                    <TableCell className="text-right">{fmtIDR(r.total)}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Modal Detail */}
      <Modal isOpen={!!selectedOrder} onOpenChange={(open)=>{ if (!open) setSelectedOrder(null); }} placement="center">
        <ModalContent>
          <>
            <ModalHeader>Detail Order #{selectedOrder?.order_id ?? ""}</ModalHeader>
            <ModalBody>
              {selectedOrder && selectedOrder.items && selectedOrder.items.length > 0 ? (
                <div className="divide-y divide-default-200">
                  {selectedOrder.items.map((item,i)=>(
                    <div key={i} className="py-2 flex justify-between text-sm">
                      <span>{item.quantity}× {item.product_name}</span>
                      <span>{fmtIDR(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-default-500">Tidak ada item dalam pesanan ini.</p>
              )}
            </ModalBody>
          </>
        </ModalContent>
      </Modal>
    </div>
  );
}
