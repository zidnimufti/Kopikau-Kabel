// src/pages/Inventory.tsx
import { useEffect, useState } from "react";
import { supabase } from "@/api/supabaseClient";
import * as XLSX from "xlsx"; // NEW: untuk ekspor Excel

// Komponen UI (pakai apa yang sudah kamu gunakan di project)
import {
  Button, Input, Card, CardBody, Table, TableHeader, TableColumn,
  TableBody, TableRow, TableCell
} from "@heroui/react";

type Item = { id: string; name: string; unit: string; min_stock: number | null };
type StockRow = { item_id: string; name: string; unit: string; stock: number };
type Movement = {
  id: number;
  item_id: string;
  qty: number;
  direction: "in" | "out";
  reason: "Ke kedai" | "Keperluan pribadi" | null;
  note: string | null;
  created_at: string;
  items?: Item;
};

export default function InventoryPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [stock, setStock] = useState<StockRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(false);

  // Form pergerakan
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [qty, setQty] = useState<number>(0);
  const [direction, setDirection] = useState<"in" | "out">("in");
  const [reason, setReason] = useState<"Ke kedai" | "Keperluan pribadi" | "">("");
  const [note, setNote] = useState<string>("");

  // Tambah item cepat
  const [newItemName, setNewItemName] = useState("");
  const [newItemUnit, setNewItemUnit] = useState("pcs");

  // NEW: Hapus history (rentang)
  const [rangeItemId, setRangeItemId] = useState<string>("");
  const [rangeStart, setRangeStart] = useState<string>(""); // yyyy-mm-dd
  const [rangeEnd, setRangeEnd] = useState<string>("");     // yyyy-mm-dd

  // NEW: Ekspor - mode bulanan atau rentang
  const [exportMode, setExportMode] = useState<"monthly" | "range">("monthly");
  const [exportMonth, setExportMonth] = useState<number>(new Date().getMonth() + 1); // 1-12
  const [exportYear, setExportYear] = useState<number>(new Date().getFullYear());
  const [exportStart, setExportStart] = useState<string>("");
  const [exportEnd, setExportEnd] = useState<string>("");


  async function loadAll() {
    setLoading(true);
    const [{ data: itemsData, error: e1 }, { data: stockData, error: e2 }, { data: movementsData, error: e3 }] =
      await Promise.all([
        supabase.from("items").select("*").order("name", { ascending: true }),
        supabase.from("current_stock").select("*").order("name", { ascending: true }),
        supabase
          .from("movements")
          .select("*, items:items(id,name,unit)")
          .order("created_at", { ascending: false })
          .limit(100),
      ]);
    if (e1 || e2 || e3) {
      alert(e1?.message || e2?.message || e3?.message);
    }
    setItems(itemsData || []);
    setStock(stockData || []);
    setMovements((movementsData as Movement[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const { data, error } = await supabase
      .from("items")
      .insert({ name: newItemName.trim(), unit: newItemUnit })
      .select()
      .single();
    if (error) return alert(error.message);
    setItems((prev) => [...prev, data]);
    setSelectedItemId(data.id);
    setNewItemName("");
  }

  async function submitMovement(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItemId) return alert("Pilih item dulu.");
    if (qty <= 0) return alert("Qty harus > 0.");
    if (direction === "out" && !reason) return alert("Alasan wajib diisi untuk barang keluar.");

    const payload = {
      item_id: selectedItemId,
      qty,
      direction,
      reason: direction === "out" ? (reason as "Ke kedai" | "Keperluan pribadi") : null,
      note: note || null,
    };
    const { error } = await supabase.from("movements").insert(payload);
    if (error) return alert(error.message);

    setQty(0);
    setReason("");
    setNote("");
    await loadAll();
  }

  // NEW: Hapus Item sepenuhnya (beserta semua history karena ON DELETE CASCADE)
  async function deleteItemCompletely(itemId: string, itemName: string) {
    const ok = confirm(`Hapus item "${itemName}" beserta seluruh riwayatnya? Tindakan ini tidak bisa dibatalkan.`);
    if (!ok) return;
    const { error } = await supabase.from("items").delete().eq("id", itemId);
    if (error) return alert(error.message);
    await loadAll();
  }

  // NEW: Hapus 1 baris movement (history)
  async function deleteMovement(id: number) {
    const ok = confirm("Hapus riwayat ini?");
    if (!ok) return;
    const { error } = await supabase.from("movements").delete().eq("id", id);
    if (error) return alert(error.message);
    await loadAll();
  }

  // NEW: Hapus history berdasarkan rentang tanggal (opsional filter per item)
  async function deleteHistoryByRange() {
    if (!rangeStart || !rangeEnd) return alert("Isi tanggal mulai & akhir.");
    const start = new Date(rangeStart);
    const end = new Date(rangeEnd);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return alert("Format tanggal tidak valid.");
    // exclusive upper bound (tambahkan 1 hari)
    const endExclusive = new Date(end);
    endExclusive.setDate(endExclusive.getDate() + 1);

    const labelItem = rangeItemId ? (items.find(i => i.id === rangeItemId)?.name ?? "") : "SEMUA ITEM";
    const ok = confirm(`Hapus history periode ${rangeStart} s.d. ${rangeEnd} untuk ${labelItem}?`);
    if (!ok) return;

    let q = supabase.from("movements").delete()
      .gte("created_at", start.toISOString())
      .lt("created_at", endExclusive.toISOString());
    if (rangeItemId) q = q.eq("item_id", rangeItemId);

    const { error } = await q;
    if (error) return alert(error.message);
    await loadAll();
  }

  // NEW: Ambil data movements untuk ekspor
  async function fetchMovementsInRange(startISO: string, endISO: string) {
    const { data, error } = await supabase
      .from("movements")
      .select("*, items:items(name,unit)")
      .gte("created_at", startISO)
      .lt("created_at", endISO)
      .order("created_at", { ascending: true });
    if (error) {
      alert(error.message);
      return [];
    }
    return (data as Movement[]) || [];
  }

  // NEW: Ekspor Excel (Bulanan atau Rentang)
  async function exportExcel() {
    let start: Date;
    let endExclusive: Date;

    if (exportMode === "monthly") {
      // bulan 1–12; Date pakai 0–11
      start = new Date(exportYear, exportMonth - 1, 1);
      // first day next month
      endExclusive = new Date(exportYear, exportMonth, 1);
    } else {
      if (!exportStart || !exportEnd) return alert("Isi tanggal mulai & akhir ekspor.");
      start = new Date(exportStart);
      const end = new Date(exportEnd);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return alert("Format tanggal tidak valid.");
      endExclusive = new Date(end);
      endExclusive.setDate(endExclusive.getDate() + 1);
    }

    const rows = await fetchMovementsInRange(start.toISOString(), endExclusive.toISOString());

    // siapkan data sheet
    const detail = rows.map((m) => ({
      Waktu: new Date(m.created_at).toLocaleString(),
      Item: m.items?.name ?? m.item_id,
      Arah: m.direction === "in" ? "Masuk" : "Keluar",
      Qty: m.qty,
      Unit: m.items?.unit ?? "",
      Alasan: m.reason ?? "",
      Catatan: m.note ?? "",
    }));

    // ringkasan total per item dalam periode
    const sumPerItem = new Map<string, number>();
    for (const m of rows) {
      const key = m.items?.name ?? m.item_id;
      const delta = m.direction === "in" ? m.qty : -m.qty;
      sumPerItem.set(key, (sumPerItem.get(key) || 0) + Number(delta));
    }
    const ringkasan = Array.from(sumPerItem.entries()).map(([item, total]) => ({
      Item: item,
      "Net Masuk(+) / Keluar(-)": total,
    }));

    // buat workbook
    const wb = XLSX.utils.book_new();
    const wsDetail = XLSX.utils.json_to_sheet(detail);
    const wsRingkasan = XLSX.utils.json_to_sheet(ringkasan);
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detail");
    XLSX.utils.book_append_sheet(wb, wsRingkasan, "Ringkasan");

    const niceName =
      exportMode === "monthly"
        ? `Inventori_${exportYear}-${String(exportMonth).padStart(2, "0")}.xlsx`
        : `Inventori_${exportStart}_sd_${exportEnd}.xlsx`;

    XLSX.writeFile(wb, niceName);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">Inventori Bahan Kopi</h1>

      {/* RINGKASAN STOK + HAPUS ITEM */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Stok Terkini</h2>
            {/* NEW: Hapus item terpilih */}
            <div className="flex gap-2">
              <select
                className="border rounded-md p-2"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">-- pilih item --</option>
                {items.sort((a,b)=>a.name.localeCompare(b.name)).map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                ))}
              </select>
              <Button
                color="danger"
                variant="flat"
                isDisabled={!selectedItemId}
                onPress={() => {
                  const it = items.find(i => i.id === selectedItemId);
                  if (it) deleteItemCompletely(it.id, it.name);
                }}
              >
                Hapus Item + History
              </Button>
            </div>
          </div>

          <Table aria-label="stok kini">
            <TableHeader>
              <TableColumn>Item</TableColumn>
              <TableColumn>Stok</TableColumn>
              <TableColumn>Unit</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Belum ada data stok." items={stock}>
              {(row: StockRow) => (
                <TableRow key={row.item_id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{Number(row.stock).toLocaleString()}</TableCell>
                  <TableCell>{row.unit}</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* FORM PERGERAKAN */}
      <Card>
        <CardBody className="space-y-4">
          <h2 className="text-lg font-semibold">Catat Pergerakan Stok</h2>

          {/* Tambah item cepat */}
          <form onSubmit={handleAddItem} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <Input label="Nama item baru" placeholder="biji kopi arabica" value={newItemName} onChange={(e) => setNewItemName(e.target.value)} />
            <Input label="Unit" placeholder="kg / liter / pcs" value={newItemUnit} onChange={(e) => setNewItemUnit(e.target.value)} />
            <div className="md:col-span-1">
              <Button type="submit" color="secondary" variant="flat">+ Tambah Item</Button>
            </div>
          </form>

          {/* Form in/out */}
          <form onSubmit={submitMovement} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="text-sm font-medium">Pilih Item</label>
              <select
                className="w-full border rounded-md p-2"
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
              >
                <option value="">-- pilih item --</option>
                {items.sort((a,b)=>a.name.localeCompare(b.name)).map((i) => (
                  <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Arah</label>
              <select className="w-full border rounded-md p-2" value={direction} onChange={(e) => setDirection(e.target.value as "in"|"out")}>
                <option value="in">Masuk</option>
                <option value="out">Keluar</option>
              </select>
            </div>

            <Input type="number" label="Qty" placeholder="contoh: 1.5"
              value={qty ? String(qty) : ""} onChange={(e) => setQty(Number(e.target.value))} />

            {direction === "out" && (
              <div>
                <label className="text-sm font-medium">Alasan</label>
                <select
                  required
                  className="w-full border rounded-md p-2"
                  value={reason}
                  onChange={(e) => setReason(e.target.value as any)}
                >
                  <option value="">-- pilih alasan --</option>
                  <option value="Ke kedai">Ke kedai</option>
                  <option value="Keperluan pribadi">Keperluan pribadi</option>
                </select>
              </div>
            )}

            <Input label="Catatan (opsional)" placeholder="contoh: untuk batch latte" value={note} onChange={(e) => setNote(e.target.value)} />

            <div>
              <Button type="submit" color="primary" isDisabled={loading}>Simpan</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* RIWAYAT + HAPUS PER BARIS */}
      <Card>
        <CardBody>
          <h2 className="text-lg font-semibold mb-4">Riwayat Pergerakan (100 terbaru)</h2>
          <Table aria-label="riwayat" removeWrapper>
            <TableHeader>
              <TableColumn>Waktu</TableColumn>
              <TableColumn>Item</TableColumn>
              <TableColumn>Arah</TableColumn>
              <TableColumn>Kuantitas</TableColumn>
              <TableColumn>Alasan</TableColumn>
              <TableColumn>Catatan</TableColumn>
              <TableColumn>Aksi</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Belum ada pergerakan." items={movements}>
              {(m: Movement) => (
                <TableRow key={m.id}>
                  <TableCell>{new Date(m.created_at).toLocaleString()}</TableCell>
                  <TableCell>{m.items?.name}</TableCell>
                  <TableCell className={m.direction === "in" ? "text-green-600" : "text-red-600"}>
                    {m.direction === "in" ? "Masuk" : "Keluar"}
                  </TableCell>
                  <TableCell>{m.qty}</TableCell>
                  <TableCell>{m.reason ?? "-"}</TableCell>
                  <TableCell>{m.note ?? "-"}</TableCell>
                  <TableCell>
                    <Button size="sm" color="danger" variant="light" onPress={() => deleteMovement(m.id)}>
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardBody>
      </Card>

      {/* NEW: HAPUS HISTORY (RENTANG) & EKSPOR EXCEL */}
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* HAPUS HISTORY PER RENTANG */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Hapus History (Rentang Tanggal)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="text-sm font-medium">Batas ke Item (opsional)</label>
                <select
                  className="w-full border rounded-md p-2"
                  value={rangeItemId}
                  onChange={(e) => setRangeItemId(e.target.value)}
                >
                  <option value="">SEMUA ITEM</option>
                  {items.sort((a,b)=>a.name.localeCompare(b.name)).map((i)=>(
                    <option key={i.id} value={i.id}>{i.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Mulai</label>
                <Input type="date" value={rangeStart} onChange={(e)=>setRangeStart(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium">Sampai</label>
                <Input type="date" value={rangeEnd} onChange={(e)=>setRangeEnd(e.target.value)} />
              </div>
            </div>
            <Button color="danger" variant="flat" onPress={deleteHistoryByRange}>
              Hapus History Sesuai Rentang
            </Button>
            <p className="text-xs text-red-600">⚠️ Tindakan permanen. Pertimbangkan ekspor dulu sebelum menghapus.</p>
          </div>

          {/* EKSPOR EXCEL */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Ekspor ke Excel</h3>

            <div className="flex gap-3 items-center">
              <label className="text-sm">Mode:</label>
              <select
                className="border rounded-md p-2"
                value={exportMode}
                onChange={(e)=>setExportMode(e.target.value as "monthly"|"range")}
              >
                <option value="monthly">Bulanan</option>
                <option value="range">Rentang Tanggal</option>
              </select>
            </div>

            {exportMode === "monthly" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Bulan</label>
                  <select
                    className="border rounded-md p-2 w-full"
                    value={exportMonth}
                    onChange={(e)=>setExportMonth(Number(e.target.value))}
                  >
                    {Array.from({length:12}, (_,i)=>i+1).map(m=>(
                      <option key={m} value={m}>{m.toString().padStart(2,"0")}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm">Tahun</label>
                  <Input type="number" value={String(exportYear)} onChange={(e)=>setExportYear(Number(e.target.value))} />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm">Mulai</label>
                  <Input type="date" value={exportStart} onChange={(e)=>setExportStart(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm">Sampai</label>
                  <Input type="date" value={exportEnd} onChange={(e)=>setExportEnd(e.target.value)} />
                </div>
              </div>
            )}

            <Button color="primary" onPress={exportExcel}>Unduh Excel</Button>
            <p className="text-xs text-default-500">File akan memiliki 2 sheet: <b>Detail</b> dan <b>Ringkasan</b> (net per item).</p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
