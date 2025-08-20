// AdminDashboardPage.tsx (versi HeroUI)

import { useState, useEffect } from "react";
import { getDashboardSummary } from "../../api/adminApi";
import {
  Card,
  CardBody,
  Button,
  Spinner,
} from "@heroui/react";

const fmtIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(n);

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <Card shadow="sm">
      {/* kunci: flex-row + text-left; hindari center */}
      <CardBody className="flex flex-row items-center gap-4 text-left">
        <div className="h-12 w-12 grid place-items-center rounded-full bg-indigo-600 text-white shrink-0">
          {icon}
        </div>
        <div className="min-w-0 text-left">
          <p className="text-sm text-default-500">{title}</p>
          <p className="text-2xl font-bold truncate">{value}</p>
        </div>
      </CardBody>
    </Card>
  );
}


export default function AdminDashboardPage() {
  const [summary, setSummary] = useState({ revenue: 0, totalOrders: 0 });
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    getDashboardSummary()
      .then((data) => setSummary(data))
      .catch((err) => console.error("Failed to fetch dashboard summary:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex items-center gap-2">
        <Spinner size="sm" /> Memuat dashboard…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <p className="text-default-500">Ringkasan performa kedai.</p>
        </div>
        <Button variant="flat" onPress={load}>
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-left">
        <StatCard
          title="Total Revenue"
          value={fmtIDR(summary.revenue)}
          icon={<span className="font-semibold text-left">Rp</span>}
        />
        <StatCard
          title="Total Orders"
          value={summary.totalOrders.toString()}
          icon={<span className="font-semibold text-left">#</span>}
        />
        {/* Tambahkan kartu statistik lain di sini */}
      </div>
    </div>
  );
}
