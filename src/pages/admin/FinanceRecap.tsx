// --- FILE: src/pages/admin/FinanceRecapPage.tsx (HeroUI, mobile-first) ---
import { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
  Spinner,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
} from "@heroui/react";

import { getAllOrders } from "../../api/adminApi";
import {
  createExpense,
  deleteExpense,
  getExpenseCategories,
  getExpenses,
  updateExpense,
  type Expense,
} from "@/api/FinanceApi";

// ===== Types =====
interface OrderLite {
  order_id: number;
  created_at: string;
  total_amount: number;
  status: "pending" | "completed" | "cancelled";
  payment_method?: "cash" | "qris" | null;
}

type ViewTab = "harian" | "pengeluaran" | "kategori";

interface DailyRow {
  day: string;
  income: number;
  expense: number;
}

// ===== Utils (sama dengan OrderHistoryPage) =====
const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
  }).format(n || 0);

const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const startOfDay = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);

  return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
};

const endOfDay = (s: string) => {
  const [y, m, d] = s.split("-").map(Number);

  return new Date(y, m - 1, d, 23, 59, 59, 999).getTime();
};

const FALLBACK_CATEGORIES = [
  "Bahan baku",
  "Gaji & upah",
  "Sewa tempat",
  "Listrik & air",
  "Peralatan",
  "Kemasan",
  "Promosi",
  "Perawatan",
  "Lain-lain",
];

const emptyForm = () => ({
  occurred_on: toInputDate(new Date()),
  category: FALLBACK_CATEGORIES[0],
  description: "",
  amount: "",
  payment_method: "cash" as "cash" | "qris" | "transfer",
});

function StatCard({
  title,
  value,
  hint,
  tone = "default",
}: {
  title: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "danger";
}) {
  const toneClass =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-danger"
        : "";

  return (
    <Card shadow="sm">
      <CardBody className="text-left">
        <p className="text-sm text-default-500">{title}</p>
        <p className={`text-2xl font-bold truncate ${toneClass}`}>{value}</p>
        {hint && <p className="text-xs text-default-400">{hint}</p>}
      </CardBody>
    </Card>
  );
}

export default function FinanceRecapPage() {
  const today = new Date();
  const d30 = new Date();

  d30.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(toInputDate(d30));
  const [endDate, setEndDate] = useState(toInputDate(today));

  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ViewTab>("harian");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const sMs = useMemo(() => startOfDay(startDate), [startDate]);
  const eMs = useMemo(() => endOfDay(endDate), [endDate]);

  const loadExpenses = useCallback(async () => {
    const data = await getExpenses(startDate, endDate);

    setExpenses(data);
  }, [startDate, endDate]);

  // Orders diambil sekali (getAllOrders sudah mengembalikan semua order),
  // pengeluaran difilter di server sesuai rentang tanggal.
  useEffect(() => {
    setLoading(true);
    Promise.all([getAllOrders(), loadExpenses()])
      .then(([orderData]) => {
        setOrders((orderData ?? []) as OrderLite[]);
        setError(null);
      })
      .catch((err) => setError(err?.message ?? "Gagal memuat data."))
      .finally(() => setLoading(false));
  }, [loadExpenses]);

  useEffect(() => {
    getExpenseCategories()
      .then((list) => {
        if (list.length) {
          setCategories(list);
          setForm((f) => ({ ...f, category: list[0] }));
        }
      })
      .catch(() => setCategories(FALLBACK_CATEGORIES));
  }, []);

  // quick ranges
  const quick = (days: number) => {
    const end = new Date();
    const start = new Date();

    start.setDate(end.getDate() - days);
    setStartDate(toInputDate(start));
    setEndDate(toInputDate(end));
  };

  const thisMonth = () => {
    const now = new Date();

    setStartDate(toInputDate(new Date(now.getFullYear(), now.getMonth(), 1)));
    setEndDate(toInputDate(now));
  };

  const lastMonth = () => {
    const now = new Date();

    setStartDate(
      toInputDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
    );
    setEndDate(toInputDate(new Date(now.getFullYear(), now.getMonth(), 0)));
  };

  // ===== Perhitungan =====
  const completedOrders = useMemo(
    () =>
      orders.filter((o) => {
        const t = new Date(o.created_at).getTime();

        return o.status === "completed" && t >= sMs && t <= eMs;
      }),
    [orders, sMs, eMs],
  );

  const totalIncome = useMemo(
    () => completedOrders.reduce((s, o) => s + (o.total_amount || 0), 0),
    [completedOrders],
  );
  const totalExpense = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses],
  );
  const profit = totalIncome - totalExpense;

  const incomeByMethod = useMemo(() => {
    const acc = { cash: 0, qris: 0, lain: 0 };

    completedOrders.forEach((o) => {
      if (o.payment_method === "cash") acc.cash += o.total_amount || 0;
      else if (o.payment_method === "qris") acc.qris += o.total_amount || 0;
      else acc.lain += o.total_amount || 0;
    });

    return acc;
  }, [completedOrders]);

  const daily: DailyRow[] = useMemo(() => {
    const map = new Map<string, DailyRow>();
    const cursor = new Date(sMs);
    const stop = new Date(sMs);

    stop.setTime(eMs);
    while (cursor.getTime() <= eMs) {
      const key = toInputDate(cursor);

      map.set(key, { day: key, income: 0, expense: 0 });
      cursor.setDate(cursor.getDate() + 1);
    }

    completedOrders.forEach((o) => {
      const key = toInputDate(new Date(o.created_at));
      const row = map.get(key);

      if (row) row.income += o.total_amount || 0;
    });
    expenses.forEach((e) => {
      const row = map.get(e.occurred_on);

      if (row) row.expense += e.amount;
    });

    return Array.from(map.values());
  }, [completedOrders, expenses, sMs, eMs]);

  const maxDaily = Math.max(
    1,
    ...daily.map((d) => Math.max(d.income, d.expense)),
  );

  const perCategory = useMemo(() => {
    const map = new Map<string, number>();

    expenses.forEach((e) =>
      map.set(e.category, (map.get(e.category) ?? 0) + e.amount),
    );

    return Array.from(map.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  // ===== Aksi =====
  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm(), category: categories[0] });
    setModalOpen(true);
  };

  const openEdit = (row: Expense) => {
    setEditing(row);
    setForm({
      occurred_on: row.occurred_on,
      category: row.category,
      description: row.description ?? "",
      amount: String(row.amount),
      payment_method: (row.payment_method ?? "cash") as
        | "cash"
        | "qris"
        | "transfer",
    });
    setModalOpen(true);
  };

  const save = async () => {
    const amount = Number(form.amount);

    if (!amount || amount <= 0) {
      setError("Nominal pengeluaran harus lebih dari 0.");

      return;
    }

    setSaving(true);
    try {
      const payload = {
        occurred_on: form.occurred_on,
        category: form.category,
        description: form.description || null,
        amount,
        payment_method: form.payment_method,
      };

      if (editing) await updateExpense(editing.id, payload);
      else await createExpense(payload);

      await loadExpenses();
      setError(null);
      setModalOpen(false);
    } catch (err: any) {
      setError(err?.message ?? "Gagal menyimpan pengeluaran.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Expense) => {
    if (!window.confirm(`Hapus pengeluaran ${row.category} ${fmtIDR(row.amount)}?`))
      return;

    setDeletingId(row.id);
    try {
      await deleteExpense(row.id);
      await loadExpenses();
    } catch (err: any) {
      setError(err?.message ?? "Gagal menghapus pengeluaran.");
    } finally {
      setDeletingId(null);
    }
  };

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet([
        ["Periode", `${startDate} s/d ${endDate}`],
        ["Total Pemasukan (Rp)", totalIncome],
        ["  — Tunai", incomeByMethod.cash],
        ["  — QRIS", incomeByMethod.qris],
        ["  — Lainnya", incomeByMethod.lain],
        ["Total Pengeluaran (Rp)", totalExpense],
        ["Laba Bersih (Rp)", profit],
        ["Jumlah Transaksi Completed", completedOrders.length],
      ]),
      "Ringkasan",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        daily.map((d) => ({
          Tanggal: d.day,
          "Pemasukan (Rp)": d.income,
          "Pengeluaran (Rp)": d.expense,
          "Selisih (Rp)": d.income - d.expense,
        })),
      ),
      "Harian",
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        expenses.map((e) => ({
          Tanggal: e.occurred_on,
          Kategori: e.category,
          Keterangan: e.description ?? "",
          "Nominal (Rp)": e.amount,
          Metode: (e.payment_method ?? "").toUpperCase(),
        })),
      ),
      "Pengeluaran",
    );

    XLSX.writeFile(wb, `Rekap_Keuangan_${startDate}_sd_${endDate}.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2">
        <Spinner size="sm" /> Memuat rekap keuangan…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 overflow-x-hidden">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Rekap Keuangan</h1>
          <p className="text-default-500">
            Pemasukan dari order completed dikurangi pengeluaran yang dicatat.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Button color="success" onPress={exportExcel}>
            Ekspor Excel
          </Button>
          <Button color="primary" onPress={openCreate}>
            Catat Pengeluaran
          </Button>
        </div>
      </div>

      {/* Filter periode */}
      <Card>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
            <div className="min-w-0">
              <Input
                className="w-full max-w-full"
                label="Tanggal Mulai"
                max={endDate}
                size="sm"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="min-w-0">
              <Input
                className="w-full max-w-full"
                label="Tanggal Selesai"
                min={startDate}
                size="sm"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 w-full lg:col-span-2">
              <Button className="w-full" variant="flat" onPress={() => quick(7)}>
                7 hari
              </Button>
              <Button className="w-full" variant="flat" onPress={() => quick(30)}>
                30 hari
              </Button>
              <Button className="w-full" variant="flat" onPress={thisMonth}>
                Bulan ini
              </Button>
              <Button className="w-full" variant="flat" onPress={lastMonth}>
                Bulan lalu
              </Button>
            </div>
          </div>

          <div className="text-sm text-default-700">
            {completedOrders.length} order completed • {expenses.length} catatan
            pengeluaran
          </div>
        </CardBody>
      </Card>

      {error && (
        <Card shadow="none">
          <CardBody className="text-danger text-sm">{error}</CardBody>
        </Card>
      )}

      {/* Kartu ringkasan */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
        <StatCard
          hint={`Tunai ${fmtIDR(incomeByMethod.cash)} • QRIS ${fmtIDR(incomeByMethod.qris)}`}
          title="Pemasukan"
          tone="success"
          value={fmtIDR(totalIncome)}
        />
        <StatCard
          hint={`${expenses.length} catatan`}
          title="Pengeluaran"
          tone="danger"
          value={fmtIDR(totalExpense)}
        />
        <StatCard
          hint={
            totalIncome > 0
              ? `Margin ${Math.round((profit / totalIncome) * 100)}%`
              : "Belum ada pemasukan"
          }
          title="Laba Bersih"
          tone={profit >= 0 ? "success" : "danger"}
          value={fmtIDR(profit)}
        />
        <StatCard
          hint={`${daily.length} hari dalam rentang`}
          title="Rata-rata Pemasukan/Hari"
          value={fmtIDR(daily.length ? totalIncome / daily.length : 0)}
        />
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto w-full">
        <Tabs
          aria-label="Tampilan rekap"
          className="w-max"
          selectedKey={tab}
          onSelectionChange={(k) => setTab(k as ViewTab)}
        >
          <Tab key="harian" title="Grafik Harian" />
          <Tab key="pengeluaran" title="Daftar Pengeluaran" />
          <Tab key="kategori" title="Per Kategori" />
        </Tabs>
      </div>

      {/* GRAFIK HARIAN */}
      {tab === "harian" && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex gap-4 text-xs text-default-600">
              <span className="flex items-center gap-1">
                <i className="inline-block h-2 w-2 rounded-full bg-success" />
                Pemasukan
              </span>
              <span className="flex items-center gap-1">
                <i className="inline-block h-2 w-2 rounded-full bg-danger" />
                Pengeluaran
              </span>
            </div>
            <div className="flex h-48 items-end gap-1 overflow-x-auto">
              {daily.map((d) => (
                <div
                  key={d.day}
                  className="flex min-w-[20px] flex-1 flex-col items-center gap-1"
                  title={`${d.day}\nMasuk ${fmtIDR(d.income)}\nKeluar ${fmtIDR(d.expense)}`}
                >
                  <div className="flex h-36 w-full items-end justify-center gap-[2px]">
                    <div
                      className="w-1/2 rounded-t bg-success"
                      style={{ height: `${(d.income / maxDaily) * 100}%` }}
                    />
                    <div
                      className="w-1/2 rounded-t bg-danger"
                      style={{ height: `${(d.expense / maxDaily) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-default-400">
                    {d.day.slice(8)}
                  </span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* DAFTAR PENGELUARAN */}
      {tab === "pengeluaran" && (
        <>
          {/* MOBILE */}
          <div className="md:hidden space-y-3">
            {expenses.length === 0 && (
              <Card shadow="sm">
                <CardBody className="text-default-500 text-sm">
                  Belum ada pengeluaran pada rentang ini. Mulai dengan tombol
                  Catat Pengeluaran.
                </CardBody>
              </Card>
            )}
            {expenses.map((row) => (
              <Card key={row.id} className="text-left" shadow="sm">
                <CardBody className="space-y-2">
                  <div className="text-xs text-default-500">
                    {new Date(`${row.occurred_on}T00:00:00`).toLocaleDateString(
                      "id-ID",
                    )}
                  </div>
                  <div className="font-semibold break-words">{row.category}</div>
                  <div className="text-sm text-default-600 break-words">
                    {row.description || "—"}
                  </div>
                  <Chip color="danger" size="sm" variant="flat">
                    {(row.payment_method || "—").toUpperCase()}
                  </Chip>
                  <div className="font-medium">{fmtIDR(row.amount)}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="flat" onPress={() => openEdit(row)}>
                      Ubah
                    </Button>
                    <Button
                      color="danger"
                      isLoading={deletingId === row.id}
                      size="sm"
                      variant="light"
                      onPress={() => remove(row)}
                    >
                      Hapus
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>

          {/* DESKTOP */}
          <Card className="hidden md:block">
            <CardBody className="overflow-x-auto">
              <Table removeWrapper aria-label="Tabel pengeluaran">
                <TableHeader>
                  <TableColumn>Tanggal</TableColumn>
                  <TableColumn>Kategori</TableColumn>
                  <TableColumn>Keterangan</TableColumn>
                  <TableColumn>Metode</TableColumn>
                  <TableColumn>Nominal</TableColumn>
                  <TableColumn>Aksi</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent="Belum ada pengeluaran pada rentang ini."
                  items={expenses}
                >
                  {(row: Expense) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {new Date(
                          `${row.occurred_on}T00:00:00`,
                        ).toLocaleDateString("id-ID")}
                      </TableCell>
                      <TableCell>{row.category}</TableCell>
                      <TableCell>{row.description || "—"}</TableCell>
                      <TableCell>
                        <Chip size="sm" variant="flat">
                          {(row.payment_method || "—").toUpperCase()}
                        </Chip>
                      </TableCell>
                      <TableCell>{fmtIDR(row.amount)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="flat"
                          onPress={() => openEdit(row)}
                        >
                          Ubah
                        </Button>
                        <Button
                          color="danger"
                          isLoading={deletingId === row.id}
                          size="sm"
                          variant="light"
                          onPress={() => remove(row)}
                        >
                          Hapus
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

      {/* PER KATEGORI */}
      {tab === "kategori" && (
        <Card>
          <CardBody className="overflow-x-auto">
            <Table removeWrapper aria-label="Pengeluaran per kategori">
              <TableHeader>
                <TableColumn>Kategori</TableColumn>
                <TableColumn>Total</TableColumn>
                <TableColumn>Porsi</TableColumn>
              </TableHeader>
              <TableBody
                emptyContent="Belum ada data kategori."
                items={perCategory}
              >
                {(row) => (
                  <TableRow key={row.category}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{fmtIDR(row.total)}</TableCell>
                    <TableCell>
                      {totalExpense > 0
                        ? `${Math.round((row.total / totalExpense) * 100)}%`
                        : "—"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Modal tambah/ubah */}
      <Modal
        isOpen={modalOpen}
        placement="center"
        onOpenChange={(open) => setModalOpen(open)}
      >
        <ModalContent>
          <>
            <ModalHeader>
              {editing ? "Ubah Pengeluaran" : "Catat Pengeluaran"}
            </ModalHeader>
            <ModalBody className="gap-3">
              <Input
                label="Tanggal"
                type="date"
                value={form.occurred_on}
                onChange={(e) =>
                  setForm((f) => ({ ...f, occurred_on: e.target.value }))
                }
              />
              <Select
                label="Kategori"
                selectedKeys={[form.category]}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              >
                {categories.map((c) => (
                  <SelectItem key={c}>{c}</SelectItem>
                ))}
              </Select>
              <Input
                label="Nominal"
                min="0"
                startContent="Rp"
                type="number"
                value={form.amount}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: e.target.value }))
                }
              />
              <Input
                label="Keterangan"
                placeholder="mis. beli 5 kg biji arabika"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
              <Select
                label="Metode Pembayaran"
                selectedKeys={[form.payment_method]}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    payment_method: e.target.value as
                      | "cash"
                      | "qris"
                      | "transfer",
                  }))
                }
              >
                <SelectItem key="cash">Tunai</SelectItem>
                <SelectItem key="qris">QRIS</SelectItem>
                <SelectItem key="transfer">Transfer</SelectItem>
              </Select>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={() => setModalOpen(false)}>
                Batal
              </Button>
              <Button color="primary" isLoading={saving} onPress={save}>
                Simpan
              </Button>
            </ModalFooter>
          </>
        </ModalContent>
      </Modal>
    </div>
  );
}