"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  createRak,
  updateRak,
  deleteRak,
  createDus,
  updateDus,
  deleteDus,
  createPembungkus,
  updatePembungkus,
  deletePembungkus,
} from "@/app/actions/location-actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FolderTree,
  FolderOpen,
  Layers,
  Plus,
  Edit,
  Trash2,
  Loader2,
  MapPin,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
} from "lucide-react";

interface LocationsManagerProps {
  initialRakList: any[];
  initialDusList: any[];
  initialPembungkusList: any[];
}

export default function LocationsManager({
  initialRakList,
  initialDusList,
  initialPembungkusList,
}: LocationsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState("rak");
  const [filterRakId, setFilterRakId] = useState<string | null>(null);
  const [filterDusId, setFilterDusId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filterByRak = (rakId: string) => {
    setFilterRakId(rakId);
    setActiveTab("dus");
  };

  const filterByDus = (dusId: string) => {
    setFilterDusId(dusId);
    setActiveTab("pembungkus");
  };

  // Search states
  const [rakSearch, setRakSearch] = useState("");
  const [dusSearch, setDusSearch] = useState("");
  const [pemSearch, setPemSearch] = useState("");

  useEffect(() => {
    const tab = searchParams.get("tab");
    const q = searchParams.get("search");
    if (tab) {
      setActiveTab(tab);
      if (q) {
        if (tab === "rak") setRakSearch(q);
        else if (tab === "dus") setDusSearch(q);
        else if (tab === "pembungkus") setPemSearch(q);
      }
    }
  }, [searchParams]);

  // Capacity filter states
  const [rakCapFilter, setRakCapFilter] = useState<"all" | "has_items" | "empty">("all");
  const [dusCapFilter, setDusCapFilter] = useState<"all" | "has_items" | "empty">("all");
  const [pemCapFilter, setPemCapFilter] = useState<"all" | "has_items" | "empty">("all");

  // Delete confirmation states
  const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<"rak" | "dus" | "pembungkus" | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteItemName, setDeleteItemName] = useState<string | null>(null);

  // Sorting states
  const [rakSort, setRakSort] = useState<{ key: "namaRak" | "kapasitas"; direction: "asc" | "desc" } | null>({ key: "namaRak", direction: "asc" });
  const [dusSort, setDusSort] = useState<{ key: "namaDus" | "rak" | "kapasitas"; direction: "asc" | "desc" } | null>({ key: "namaDus", direction: "asc" });
  const [pemSort, setPemSort] = useState<{ key: "namaPembungkus" | "dus" | "kapasitas"; direction: "asc" | "desc" } | null>({ key: "namaPembungkus", direction: "asc" });

  const toggleRakSort = (key: "namaRak" | "kapasitas") => {
    if (rakSort?.key === key) {
      setRakSort({ key, direction: rakSort.direction === "asc" ? "desc" : "asc" });
    } else {
      setRakSort({ key, direction: "asc" });
    }
  };

  const toggleDusSort = (key: "namaDus" | "rak" | "kapasitas") => {
    if (dusSort?.key === key) {
      setDusSort({ key, direction: dusSort.direction === "asc" ? "desc" : "asc" });
    } else {
      setDusSort({ key, direction: "asc" });
    }
  };

  const togglePemSort = (key: "namaPembungkus" | "dus" | "kapasitas") => {
    if (pemSort?.key === key) {
      setPemSort({ key, direction: pemSort.direction === "asc" ? "desc" : "asc" });
    } else {
      setPemSort({ key, direction: "asc" });
    }
  };

  const renderSortIndicator = (currentSort: any, key: string) => {
    if (currentSort?.key !== key) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-muted-foreground/30" />;
    }
    return currentSort.direction === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 text-primary animate-in fade-in duration-200" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-primary animate-in fade-in duration-200" />
    );
  };

  // Processed lists (searching, filtering, sorting)
  const processedRakList = (() => {
    let list = [...initialRakList];

    if (rakSearch.trim()) {
      const q = rakSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.namaRak.toLowerCase().includes(q) ||
          (r.keterangan && r.keterangan.toLowerCase().includes(q))
      );
    }

    if (rakCapFilter === "has_items") {
      list = list.filter((r) => (r.duses?.length || 0) > 0);
    } else if (rakCapFilter === "empty") {
      list = list.filter((r) => (r.duses?.length || 0) === 0);
    }

    if (rakSort) {
      const { key, direction } = rakSort;
      list.sort((a, b) => {
        let valA = key === "namaRak" ? a.namaRak : (a.duses?.length || 0);
        let valB = key === "namaRak" ? b.namaRak : (b.duses?.length || 0);

        if (typeof valA === "string" && typeof valB === "string") {
          return direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return direction === "asc"
            ? (valA as number) - (valB as number)
            : (valB as number) - (valA as number);
        }
      });
    }

    return list;
  })();

  const processedDusList = (() => {
    let list = [...initialDusList];

    if (filterRakId) {
      list = list.filter((d) => d.rakId === filterRakId);
    }

    if (dusSearch.trim()) {
      const q = dusSearch.toLowerCase().trim();
      list = list.filter(
        (d) =>
          d.namaDus.toLowerCase().includes(q) ||
          (d.keterangan && d.keterangan.toLowerCase().includes(q)) ||
          (d.rak?.namaRak && d.rak.namaRak.toLowerCase().includes(q))
      );
    }

    if (dusCapFilter === "has_items") {
      list = list.filter((d) => (d.pembungkuses?.length || 0) > 0);
    } else if (dusCapFilter === "empty") {
      list = list.filter((d) => (d.pembungkuses?.length || 0) === 0);
    }

    if (dusSort) {
      const { key, direction } = dusSort;
      list.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        if (key === "namaDus") {
          valA = a.namaDus;
          valB = b.namaDus;
        } else if (key === "rak") {
          valA = a.rak?.namaRak || "";
          valB = b.rak?.namaRak || "";
        } else if (key === "kapasitas") {
          valA = a.pembungkuses?.length || 0;
          valB = b.pembungkuses?.length || 0;
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return direction === "asc"
            ? (valA as number) - (valB as number)
            : (valB as number) - (valA as number);
        }
      });
    }

    return list;
  })();

  const processedPembungkusList = (() => {
    let list = [...initialPembungkusList];

    if (filterRakId) {
      list = list.filter((p) => p.dus?.rakId === filterRakId);
    }

    if (filterDusId) {
      list = list.filter((p) => p.dusId === filterDusId);
    }

    if (pemSearch.trim()) {
      const q = pemSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.namaPembungkus.toLowerCase().includes(q) ||
          (p.keterangan && p.keterangan.toLowerCase().includes(q)) ||
          (p.dus?.namaDus && p.dus.namaDus.toLowerCase().includes(q)) ||
          (p.dus?.rak?.namaRak && p.dus.rak.namaRak.toLowerCase().includes(q))
      );
    }

    if (pemCapFilter === "has_items") {
      list = list.filter((p) => (p.notas?.length || 0) > 0);
    } else if (pemCapFilter === "empty") {
      list = list.filter((p) => (p.notas?.length || 0) === 0);
    }

    if (pemSort) {
      const { key, direction } = pemSort;
      list.sort((a, b) => {
        let valA: any = "";
        let valB: any = "";

        if (key === "namaPembungkus") {
          valA = a.namaPembungkus;
          valB = b.namaPembungkus;
        } else if (key === "dus") {
          valA = a.dus?.namaDus || "";
          valB = b.dus?.namaDus || "";
        } else if (key === "kapasitas") {
          valA = a.notas?.length || 0;
          valB = b.notas?.length || 0;
        }

        if (typeof valA === "string" && typeof valB === "string") {
          return direction === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return direction === "asc"
            ? (valA as number) - (valB as number)
            : (valB as number) - (valA as number);
        }
      });
    }

    return list;
  })();

  // Dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [targetType, setTargetType] = useState<"rak" | "dus" | "pembungkus">("rak");
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");

  const openCreateDialog = (type: "rak" | "dus" | "pembungkus") => {
    setDialogMode("create");
    setTargetType(type);
    setEditId(null);
    setName("");
    setDescription("");
    setParentId("");
    setDialogOpen(true);
  };

  const openEditDialog = (type: "rak" | "dus" | "pembungkus", item: any) => {
    setDialogMode("edit");
    setTargetType(type);
    setEditId(item.id);
    setName(type === "rak" ? item.namaRak : type === "dus" ? item.namaDus : item.namaPembungkus);
    setDescription(item.keterangan || "");
    setParentId(type === "dus" ? item.rakId || "" : type === "pembungkus" ? item.dusId || "" : "");
    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama wajib diisi");

    startTransition(async () => {
      let res: any;

      if (targetType === "rak") {
        if (dialogMode === "create") {
          res = await createRak({ namaRak: name, keterangan: description });
        } else {
          res = await updateRak(editId!, { namaRak: name, keterangan: description });
        }
      } else if (targetType === "dus") {
        if (dialogMode === "create") {
          res = await createDus({ namaDus: name, keterangan: description, rakId: parentId });
        } else {
          res = await updateDus(editId!, { namaDus: name, keterangan: description, rakId: parentId });
        }
      } else if (targetType === "pembungkus") {
        if (dialogMode === "create") {
          res = await createPembungkus({ namaPembungkus: name, keterangan: description, dusId: parentId });
        } else {
          res = await updatePembungkus(editId!, { namaPembungkus: name, keterangan: description, dusId: parentId });
        }
      }

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Berhasil ${dialogMode === "create" ? "menambahkan" : "memperbarui"} ${targetType}`);
        setDialogOpen(false);
      }
    });
  };

  const handleDeleteTrigger = (type: "rak" | "dus" | "pembungkus", id: string, name: string) => {
    setDeleteType(type);
    setDeleteId(id);
    setDeleteItemName(name);
    setIsOpenDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteType || !deleteId) return;

    startTransition(async () => {
      let res: any;
      if (deleteType === "rak") res = await deleteRak(deleteId);
      else if (deleteType === "dus") res = await deleteDus(deleteId);
      else if (deleteType === "pembungkus") res = await deletePembungkus(deleteId);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Berhasil menghapus ${deleteType}`);
        setIsOpenDeleteConfirm(false);
        setDeleteType(null);
        setDeleteId(null);
        setDeleteItemName(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast notification component is globally configured, sonner handles it */}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b border-border/40 pb-3">
          <TabsList className="bg-secondary/40 p-1 rounded-xl">
            <TabsTrigger value="rak" className="rounded-lg text-xs font-semibold px-4 py-2 flex items-center gap-1.5">
              <FolderTree className="h-3.5 w-3.5" />
              Rak ({initialRakList.length})
            </TabsTrigger>
            <TabsTrigger value="dus" className="rounded-lg text-xs font-semibold px-4 py-2 flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              Dus ({initialDusList.length})
            </TabsTrigger>
            <TabsTrigger value="pembungkus" className="rounded-lg text-xs font-semibold px-4 py-2 flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              Pembungkus ({initialPembungkusList.length})
            </TabsTrigger>
          </TabsList>

          <Button
            size="sm"
            onClick={() => openCreateDialog(activeTab as any)}
            className="rounded-xl font-semibold text-xs shadow-md shadow-primary/10"
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Tambah {activeTab === "rak" ? "Rak" : activeTab === "dus" ? "Dus" : "Pembungkus"}
          </Button>
        </div>

        {/* 1. TAB RAK */}
        <TabsContent value="rak" className="mt-4">
          <Card className="border-border/40 rounded-2xl bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold">Rak Penyimpanan</CardTitle>
              <CardDescription className="text-xs">
                Lemari rak besar tempat diletakkannya dus arsip bukti transaksi.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search & Filter Control Panel */}
              <div className="p-4 bg-secondary/5 border-b border-border/30 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute inset-y-0 left-3 flex items-center h-full w-4 text-muted-foreground/60 pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Cari nama rak atau keterangan..."
                    value={rakSearch}
                    onChange={(e) => setRakSearch(e.target.value)}
                    className="pl-9 pr-8 h-9 rounded-xl text-xs bg-background"
                  />
                  {rakSearch && (
                    <button
                      type="button"
                      onClick={() => setRakSearch("")}
                      className="absolute inset-y-0 right-2.5 flex items-center text-muted-foreground/50 hover:text-foreground font-bold text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="w-full sm:w-[180px]">
                  <select
                    value={rakCapFilter}
                    onChange={(e) => setRakCapFilter(e.target.value as any)}
                    className="w-full h-9 bg-background border border-border text-foreground px-2.5 py-1 text-xs rounded-xl outline-none"
                  >
                    <option value="all">Semua Kapasitas</option>
                    <option value="has_items">Ada Dus (Tidak Kosong)</option>
                    <option value="empty">Kosong (0 Dus)</option>
                  </select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead 
                      className="font-semibold text-xs text-muted-foreground w-[30%] cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                      onClick={() => toggleRakSort("namaRak")}
                    >
                      <span className="flex items-center">
                        Nama Rak
                        {renderSortIndicator(rakSort, "namaRak")}
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground w-[40%]">Keterangan</TableHead>
                    <TableHead 
                      className="font-semibold text-xs text-muted-foreground w-[15%] cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                      onClick={() => toggleRakSort("kapasitas")}
                    >
                      <span className="flex items-center">
                        Kapasitas
                        {renderSortIndicator(rakSort, "kapasitas")}
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground text-right w-[15%]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedRakList.length > 0 ? (
                    processedRakList.map((rak) => (
                      <TableRow key={rak.id} className="border-border/20 hover:bg-secondary/10">
                        <TableCell className="font-bold text-sm text-foreground flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <button
                            onClick={() => filterByRak(rak.id)}
                            className="hover:underline hover:text-primary transition-colors text-left font-bold cursor-pointer"
                          >
                            {rak.namaRak}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{rak.keterangan || "-"}</TableCell>
                        <TableCell className="text-xs font-semibold text-primary">
                          <button
                            onClick={() => filterByRak(rak.id)}
                            className="hover:underline hover:text-primary text-primary transition-colors font-semibold cursor-pointer"
                          >
                            {rak.duses?.length || 0} Dus
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                              onClick={() => openEditDialog("rak", rak)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteTrigger("rak", rak.id, rak.namaRak)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="h-28 text-center text-xs text-muted-foreground">
                        Belum ada rak yang terdaftar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. TAB DUS */}
        <TabsContent value="dus" className="mt-4">
          <Card className="border-border/40 rounded-2xl bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">Dus Arsip (Boxes)</CardTitle>
                  <CardDescription className="text-xs">
                    Dus penampung map berkas bukti pemindahbukuan. Diposisikan di dalam Rak.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search & Filter Control Panel */}
              <div className="p-4 bg-secondary/5 border-b border-border/30 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute inset-y-0 left-3 flex items-center h-full w-4 text-muted-foreground/60 pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Cari nama dus, keterangan, atau rak..."
                    value={dusSearch}
                    onChange={(e) => setDusSearch(e.target.value)}
                    className="pl-9 pr-8 h-9 rounded-xl text-xs bg-background"
                  />
                  {dusSearch && (
                    <button
                      type="button"
                      onClick={() => setDusSearch("")}
                      className="absolute inset-y-0 right-2.5 flex items-center text-muted-foreground/50 hover:text-foreground font-bold text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="w-full sm:w-[160px]">
                  <select
                    value={filterRakId || ""}
                    onChange={(e) => setFilterRakId(e.target.value || null)}
                    className="w-full h-9 bg-background border border-border text-foreground px-2.5 py-1 text-xs rounded-xl outline-none"
                  >
                    <option value="">Semua Rak</option>
                    {initialRakList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.namaRak}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-[160px]">
                  <select
                    value={dusCapFilter}
                    onChange={(e) => setDusCapFilter(e.target.value as any)}
                    className="w-full h-9 bg-background border border-border text-foreground px-2.5 py-1 text-xs rounded-xl outline-none"
                  >
                    <option value="all">Semua Kapasitas</option>
                    <option value="has_items">Ada Map (Tidak Kosong)</option>
                    <option value="empty">Kosong (0 Map)</option>
                  </select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead 
                      className="font-semibold text-xs text-muted-foreground w-[25%] cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                      onClick={() => toggleDusSort("namaDus")}
                    >
                      <span className="flex items-center">
                        Nama Dus
                        {renderSortIndicator(dusSort, "namaDus")}
                      </span>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-xs text-muted-foreground w-[25%] cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                      onClick={() => toggleDusSort("rak")}
                    >
                      <span className="flex items-center">
                        Posisi Rak
                        {renderSortIndicator(dusSort, "rak")}
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground w-[30%]">Keterangan</TableHead>
                    <TableHead 
                      className="font-semibold text-xs text-muted-foreground w-[10%] cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                      onClick={() => toggleDusSort("kapasitas")}
                    >
                      <span className="flex items-center">
                        Isi
                        {renderSortIndicator(dusSort, "kapasitas")}
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground text-right w-[10%]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedDusList.length > 0 ? (
                    processedDusList.map((dus) => (
                      <TableRow key={dus.id} className="border-border/20 hover:bg-secondary/10">
                        <TableCell className="font-bold text-sm text-foreground flex items-center gap-2">
                          <FolderOpen className="h-4 w-4 text-amber-500" />
                          <button
                            onClick={() => filterByDus(dus.id)}
                            className="hover:underline hover:text-amber-500 transition-colors text-left font-bold cursor-pointer"
                          >
                            {dus.namaDus}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs text-foreground font-medium">
                          {dus.rak ? (
                            <button
                              onClick={() => setActiveTab("rak")}
                              className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              <MapPin className="h-3 w-3" />
                              {dus.rak.namaRak}
                            </button>
                          ) : (
                            <span className="text-muted-foreground italic">Belum ditempatkan</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{dus.keterangan || "-"}</TableCell>
                        <TableCell className="text-xs font-semibold text-primary">
                          <button
                            onClick={() => filterByDus(dus.id)}
                            className="hover:underline hover:text-primary text-primary transition-colors font-semibold cursor-pointer"
                          >
                            {dus.pembungkuses?.length || 0} Map
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                              onClick={() => openEditDialog("dus", dus)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteTrigger("dus", dus.id, dus.namaDus)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                        Belum ada Dus yang terdaftar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. TAB PEMBUNGKUS */}
        <TabsContent value="pembungkus" className="mt-4">
          <Card className="border-border/40 rounded-2xl bg-card shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-base font-bold">Pembungkus (Maps/Envelopes)</CardTitle>
                  <CardDescription className="text-xs">
                    Pembungkus fisik terkecil (seperti map kertas, amplop cokelat) yang berisi lembar nota.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {/* Search & Filter Control Panel */}
              <div className="p-4 bg-secondary/5 border-b border-border/30 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute inset-y-0 left-3 flex items-center h-full w-4 text-muted-foreground/60 pointer-events-none" />
                  <Input
                    type="search"
                    placeholder="Cari nama pembungkus, keterangan, dus, atau rak..."
                    value={pemSearch}
                    onChange={(e) => setPemSearch(e.target.value)}
                    className="pl-9 pr-8 h-9 rounded-xl text-xs bg-background"
                  />
                  {pemSearch && (
                    <button
                      type="button"
                      onClick={() => setPemSearch("")}
                      className="absolute inset-y-0 right-2.5 flex items-center text-muted-foreground/50 hover:text-foreground font-bold text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>
                <div className="w-full sm:w-[150px]">
                  <select
                    value={filterRakId || ""}
                    onChange={(e) => {
                      setFilterRakId(e.target.value || null);
                      setFilterDusId(null);
                    }}
                    className="w-full h-9 bg-background border border-border text-foreground px-2.5 py-1 text-xs rounded-xl outline-none"
                  >
                    <option value="">Semua Rak</option>
                    {initialRakList.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.namaRak}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full sm:w-[150px]">
                  <select
                    value={filterDusId || ""}
                    onChange={(e) => setFilterDusId(e.target.value || null)}
                    className="w-full h-9 bg-background border border-border text-foreground px-2.5 py-1 text-xs rounded-xl outline-none"
                    disabled={!filterRakId && initialDusList.length === 0}
                  >
                    <option value="">Semua Dus</option>
                    {initialDusList
                      .filter((d) => !filterRakId || d.rakId === filterRakId)
                      .map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.namaDus}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="w-full sm:w-[150px]">
                  <select
                    value={pemCapFilter}
                    onChange={(e) => setPemCapFilter(e.target.value as any)}
                    className="w-full h-9 bg-background border border-border text-foreground px-2.5 py-1 text-xs rounded-xl outline-none"
                  >
                    <option value="all">Semua Kapasitas</option>
                    <option value="has_items">Ada Nota (Tidak Kosong)</option>
                    <option value="empty">Kosong (0 Nota)</option>
                  </select>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead 
                      className="font-semibold text-xs text-muted-foreground w-[25%] cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                      onClick={() => togglePemSort("namaPembungkus")}
                    >
                      <span className="flex items-center">
                        Nama Pembungkus
                        {renderSortIndicator(pemSort, "namaPembungkus")}
                      </span>
                    </TableHead>
                    <TableHead 
                      className="font-semibold text-xs text-muted-foreground w-[25%] cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                      onClick={() => togglePemSort("dus")}
                    >
                      <span className="flex items-center">
                        Posisi Dus &amp; Rak
                        {renderSortIndicator(pemSort, "dus")}
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground w-[30%]">Keterangan</TableHead>
                    <TableHead 
                      className="font-semibold text-xs text-muted-foreground w-[10%] cursor-pointer hover:bg-secondary/10 transition-colors select-none"
                      onClick={() => togglePemSort("kapasitas")}
                    >
                      <span className="flex items-center">
                        Jumlah Bukti
                        {renderSortIndicator(pemSort, "kapasitas")}
                      </span>
                    </TableHead>
                    <TableHead className="font-semibold text-xs text-muted-foreground text-right w-[10%]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedPembungkusList.length > 0 ? (
                    processedPembungkusList.map((pem) => (
                      <TableRow key={pem.id} className="border-border/20 hover:bg-secondary/10">
                        <TableCell className="font-bold text-sm text-foreground flex items-center gap-2">
                          <Layers className="h-4 w-4 text-emerald-500" />
                          <button
                            onClick={() => router.push(`/dashboard/vouchers?pembungkusId=${pem.id}`)}
                            className="hover:underline hover:text-emerald-500 transition-colors text-left font-bold cursor-pointer"
                          >
                            {pem.namaPembungkus}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {pem.dus ? (
                            <span className="flex flex-col gap-0.5">
                              <button
                                onClick={() => setActiveTab("dus")}
                                className="text-foreground text-xs hover:underline hover:text-amber-500 text-left font-semibold cursor-pointer"
                              >
                                {pem.dus.namaDus}
                              </button>
                              {pem.dus.rak && (
                                <button
                                  onClick={() => setActiveTab("rak")}
                                  className="text-[10px] text-muted-foreground hover:underline hover:text-primary text-left cursor-pointer"
                                >
                                  di {pem.dus.rak.namaRak}
                                </button>
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground italic">Belum dimasukkan dus</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{pem.keterangan || "-"}</TableCell>
                        <TableCell className="text-xs font-semibold text-primary">
                          <button
                            onClick={() => router.push(`/dashboard/vouchers?pembungkusId=${pem.id}`)}
                            className="hover:underline hover:text-primary text-primary transition-colors font-semibold cursor-pointer"
                          >
                            {pem.notas?.length || 0} Nota
                          </button>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                              onClick={() => openEditDialog("pembungkus", pem)}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDeleteTrigger("pembungkus", pem.id, pem.namaPembungkus)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-28 text-center text-xs text-muted-foreground">
                        Belum ada Pembungkus yang terdaftar
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE & EDIT MODAL DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[420px] rounded-2xl border-border/50 bg-card/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              {dialogMode === "create" ? "Tambah" : "Edit"} {targetType === "rak" ? "Rak" : targetType === "dus" ? "Dus" : "Pembungkus"}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Isi data detail berikut untuk menyimpan perubahan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 py-2">
            {/* Nama Field */}
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold text-foreground/80">
                Nama {targetType === "rak" ? "Rak" : targetType === "dus" ? "Dus" : "Pembungkus"}
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={`Contoh: ${targetType === "rak" ? "Rak A" : targetType === "dus" ? "Dus D-01" : "28 Juni 2026"}`}
                required
                className="bg-background border-border rounded-xl text-sm"
                disabled={isPending}
              />
            </div>

            {/* Parent Selection for DUS (selects Rak) */}
            {targetType === "dus" && (
              <div className="space-y-1.5">
                <Label htmlFor="rakId" className="text-xs font-semibold text-foreground/80">Posisi Rak</Label>
                <select
                  id="rakId"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-background border border-border text-foreground px-3 py-2 text-sm rounded-xl outline-none focus:ring-1 focus:ring-primary"
                  disabled={isPending}
                >
                  <option value="">-- Belum ditempatkan di Rak (Optional) --</option>
                  {initialRakList.map((rak) => (
                    <option key={rak.id} value={rak.id}>
                      {rak.namaRak}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Parent Selection for PEMBUNGKUS (selects Dus) */}
            {targetType === "pembungkus" && (
              <div className="space-y-1.5">
                <Label htmlFor="dusId" className="text-xs font-semibold text-foreground/80">Posisi Dus (Box)</Label>
                <select
                  id="dusId"
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full bg-background border border-border text-foreground px-3 py-2 text-sm rounded-xl outline-none focus:ring-1 focus:ring-primary"
                  disabled={isPending}
                >
                  <option value="">-- Belum dimasukkan ke Dus (Optional) --</option>
                  {initialDusList.map((dus) => (
                    <option key={dus.id} value={dus.id}>
                      {dus.namaDus} {dus.rak ? `(${dus.rak.namaRak})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Keterangan Field */}
            <div className="space-y-1.5">
              <Label htmlFor="description" className="text-xs font-semibold text-foreground/80">Keterangan</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Catatan tambahan mengenai lokasi fisik ini..."
                className="bg-background border-border rounded-xl text-sm min-h-[80px]"
                disabled={isPending}
              />
            </div>

            <DialogFooter className="pt-3 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl font-semibold text-xs"
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl font-semibold text-xs bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/10"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isOpenDeleteConfirm} onOpenChange={setIsOpenDeleteConfirm}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              Hapus {deleteType === "rak" ? "Rak" : deleteType === "dus" ? "Dus" : "Pembungkus"}?
            </DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">
              Apakah Anda yakin ingin menghapus {deleteType === "rak" ? "rak" : deleteType === "dus" ? "dus" : "pembungkus"} <span className="font-semibold text-foreground">{deleteItemName}</span>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsOpenDeleteConfirm(false); setDeleteType(null); setDeleteId(null); setDeleteItemName(null); }}
              disabled={isPending}
              className="rounded-xl text-xs h-9 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="rounded-xl text-xs h-9 cursor-pointer"
            >
              {isPending ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Menghapus...
                </span>
              ) : (
                "Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
