// BaristaListPage.tsx (HeroUI)

import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { getBaristas } from "../../api/adminApi";
import { UserProfile } from "../../types";
import {
  Card,
  CardBody,
  Input,
  Button,
  Spinner,
  Avatar,
} from "@heroui/react";

const BaristaListPage = () => {
  const [baristas, setBaristas] = useState<Partial<UserProfile>[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = () => {
    setLoading(true);
    getBaristas()
      .then((data) => setBaristas(data ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return baristas;
    return baristas.filter(
      (b) =>
        (b.full_name?.toLowerCase().includes(q) ?? false) ||
        (b.email?.toLowerCase().includes(q) ?? false)
    );
  }, [baristas, query]);

  if (loading)
    return (
      <div className="p-6 flex items-center gap-2">
        <Spinner size="sm" /> Memuat barista…
      </div>
    );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Kelola Barista</h1>
          <p className="text-default-500">
            Pilih barista untuk melihat laporan penjualan detail.
          </p>
        </div>
        <div className="hidden sm:flex gap-2">
          <Input
            placeholder="Cari nama atau email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-64"
          />
          <Button variant="flat" onPress={load}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Search untuk mobile */}
      <div className="sm:hidden">
        <Input
          placeholder="Cari nama atau email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardBody className="text-center text-default-500">
            Tidak ada barista yang cocok.
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((b) => (
            <Card
  key={String(b.id)}
  as={Link}
  to={`/app/admin/baristas/${b.id}`}
  isPressable
  shadow="sm"
  className="hover:shadow-md"
>
  <CardBody className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-left">
    <Avatar name={b.full_name ?? "B"} />

    {/* teks: pastikan mengambil lebar penuh & left-aligned */}
    <div className="min-w-0 sm:flex-1 w-full text-left">
      <div className="font-semibold text-indigo-600 truncate">{b.full_name}</div>
      <div className="text-sm text-default-500 truncate">{b.email}</div>
    </div>

    {/* tombol: full-width di mobile, ke kanan di desktop */}
    <Button
      as={Link}
      to={`/app/admin/baristas/${b.id}`}
      size="sm"
      variant="flat"
      className="w-full sm:w-auto sm:ml-auto"
    >
      Detail
    </Button>
  </CardBody>
</Card>

          ))}
        </div>
      )}
    </div>
  );
};

export default BaristaListPage;
