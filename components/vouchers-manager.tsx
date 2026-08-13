"use client";

import React, { useState, useTransition, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { createVoucher, updateVoucher, deleteVoucher, createVouchersBulk, getLatestVoucherNumberForUser } from "@/app/actions/voucher-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  FileSpreadsheet,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  MapPin,
  FolderOpen,
  FolderTree,
  Layers,
  Calendar,
  DollarSign,
  Loader2,
  FileText,
  Eye,
  XCircle,
  EyeOff,
  User as UserIcon,
  UploadCloud,
  CheckCircle2,
  Paperclip,
  X,
  ChevronRight,
} from "lucide-react";

interface VouchersManagerProps {
  vouchers: any[];
  rakList: any[];
  dusList: any[];
  pembungkusList: any[];
  userList: any[];
  currentFilters: {
    search?: string;
    rakId?: string;
    dusId?: string;
    pembungkusId?: string;
    tahun?: string;
    bulan?: string;
    isVerified?: string;
    statusKeberadaan?: string;
  };
}

interface BulkRow {
  id: string;
  nomorBukti: string;
  tanggalBukti: string;
  keterangan: string;
  rakId: string;
  dusId: string;
  pembungkusId: string;
  userId?: string;
}

const MONTHS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function getIndonesianDayName(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[date.getDay()];
}

function incrementDocumentNumber(num: string): string {
  if (!num) return "";
  const regex = /\d+/g;
  let match;
  const matches: { index: number; value: string }[] = [];
  while ((match = regex.exec(num)) !== null) {
    matches.push({ index: match.index, value: match[0] });
  }

  if (matches.length === 0) return num;

  let targetGroupIndex = matches.length - 1;
  
  if (matches.length > 1) {
    const lastGroup = matches[matches.length - 1];
    const val = parseInt(lastGroup.value, 10);
    if (lastGroup.value.length === 4 && val >= 1990 && val <= 2100) {
      targetGroupIndex = matches.length - 2;
    }
  }

  const targetGroup = matches[targetGroupIndex];
  const prefix = num.substring(0, targetGroup.index);
  const suffix = num.substring(targetGroup.index + targetGroup.value.length);
  const numberStr = targetGroup.value;
  const nextNum = parseInt(numberStr, 10) + 1;
  const paddedNum = nextNum.toString().padStart(numberStr.length, "0");

  return `${prefix}${paddedNum}${suffix}`;
}



export default function VouchersManager({
  vouchers,
  rakList,
  dusList,
  pembungkusList,
  userList,
  currentFilters,
}: VouchersManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Filters state
  const [search, setSearch] = useState(currentFilters.search || "");
  const [rakId, setRakId] = useState(currentFilters.rakId || "");
  const [dusId, setDusId] = useState(currentFilters.dusId || "");
  const [pembungkusId, setPembungkusId] = useState(currentFilters.pembungkusId || "");
  const [tahun, setTahun] = useState(currentFilters.tahun || "");
  const [bulan, setBulan] = useState(currentFilters.bulan || "");
  const [isVerified, setIsVerified] = useState(currentFilters.isVerified || "");
  const [statusKeberadaan, setStatusKeberadaan] = useState(currentFilters.statusKeberadaan || "");

  // Modal / Detail states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState<string | null>(null);

  // Form states
  const [formNomor, setFormNomor] = useState("");
  const [formTanggal, setFormTanggal] = useState(""); // yyyy-mm-dd
  const [formKeterangan, setFormKeterangan] = useState("");
  const [formUser, setFormUser] = useState("");
  
  // Hierarchical form selection
  const [formRakId, setFormRakId] = useState("");
  const [formDusId, setFormDusId] = useState("");
  const [formPembungkusId, setFormPembungkusId] = useState("");


  // Bulk add states
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([]);
  const [bulkDefaultDate, setBulkDefaultDate] = useState("");
  const [bulkDefaultRakId, setBulkDefaultRakId] = useState("");
  const [bulkDefaultDusId, setBulkDefaultDusId] = useState("");
  const [bulkDefaultPembungkusId, setBulkDefaultPembungkusId] = useState("");

  // Delete confirmation states
  const [isOpenDeleteConfirm, setIsOpenDeleteConfirm] = useState(false);
  const [voucherIdToDelete, setVoucherIdToDelete] = useState<string | null>(null);
  const [voucherNumberToDelete, setVoucherNumberToDelete] = useState<string | null>(null);

  // Bulk add user state
  const [bulkDefaultUserId, setBulkDefaultUserId] = useState("");

  // Filtered lists for form selection
  const formDuses = (() => {
    if (formRakId === "unplaced") {
      return dusList.filter((d) => !d.rakId);
    }
    if (formRakId) {
      return dusList.filter((d) => d.rakId === formRakId);
    }
    return dusList;
  })();

  const formPembungkuses = (() => {
    if (formDusId === "unplaced") {
      return pembungkusList.filter((p) => !p.dusId);
    }
    if (formDusId) {
      return pembungkusList.filter((p) => p.dusId === formDusId);
    }
    return [];
  })();

  // --- Bulk Add Helpers ---
  const openBulkAddDialog = () => {
    let initialNomor = "";
    if (vouchers && vouchers.length > 0) {
      const latestVoucher = vouchers[0];
      if (latestVoucher && latestVoucher.nomorBukti) {
        initialNomor = incrementDocumentNumber(latestVoucher.nomorBukti);
      }
    }
    if (!initialNomor) initialNomor = "01100001";

    const todayStr = new Date().toISOString().split("T")[0];

    const firstRow: BulkRow = {
      id: `row-1`,
      nomorBukti: initialNomor,
      tanggalBukti: todayStr,
      keterangan: "",
      rakId: "",
      dusId: "",
      pembungkusId: "",
    };

    const secondRow: BulkRow = {
      id: `row-2`,
      nomorBukti: incrementDocumentNumber(initialNomor),
      tanggalBukti: todayStr,
      keterangan: "",
      rakId: "",
      dusId: "",
      pembungkusId: "",
    };

    const thirdRow: BulkRow = {
      id: `row-3`,
      nomorBukti: incrementDocumentNumber(secondRow.nomorBukti),
      tanggalBukti: todayStr,
      keterangan: "",
      rakId: "",
      dusId: "",
      pembungkusId: "",
    };

    setBulkRows([firstRow, secondRow, thirdRow]);
    setBulkDefaultDate(todayStr);
    setBulkDefaultRakId("");
    setBulkDefaultDusId("");
    setBulkDefaultPembungkusId("");
    setBulkDefaultUserId("");
    setBulkDialogOpen(true);
  };

  const handleBulkAddRow = () => {
    setBulkRows((prev) => {
      let nextNomor = "";
      let lastDate = bulkDefaultDate;
      let lastRak = bulkDefaultRakId;
      let lastDus = bulkDefaultDusId;
      let lastPembungkus = bulkDefaultPembungkusId;

      if (prev.length > 0) {
        const lastRow = prev[prev.length - 1];
        nextNomor = incrementDocumentNumber(lastRow.nomorBukti);
        lastDate = lastRow.tanggalBukti;
        lastRak = lastRow.rakId;
        lastDus = lastRow.dusId;
        lastPembungkus = lastRow.pembungkusId;
      } else {
        nextNomor = "01100001";
      }

      return [
        ...prev,
        {
          id: `row-${Date.now()}`,
          nomorBukti: nextNomor,
          tanggalBukti: lastDate,
          keterangan: "",
          rakId: lastRak,
          dusId: lastDus,
          pembungkusId: lastPembungkus,
          userId: bulkDefaultUserId || undefined,
        },
      ];
    });
  };

  const handleBulkRemoveRow = (id: string) => {
    setBulkRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleBulkRowChange = (id: string, field: keyof BulkRow, value: any) => {
    setBulkRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row;
        const updated = { ...row, [field]: value };
        if (field === "rakId") {
          updated.dusId = "";
          updated.pembungkusId = "";
        } else if (field === "dusId") {
          updated.pembungkusId = "";
        }
        return updated;
      })
    );
  };

  const applyBulkDefaultDate = (dateVal: string) => {
    setBulkDefaultDate(dateVal);
    setBulkRows((prev) => prev.map((r) => ({ ...r, tanggalBukti: dateVal })));
  };

  const applyBulkDefaultLocation = (pId: string) => {
    setBulkDefaultPembungkusId(pId);
    let rId = bulkDefaultRakId;
    let dId = bulkDefaultDusId;
    const p = pembungkusList.find(x => x.id === pId);
    if (p) {
      dId = p.dusId || "";
      const d = dusList.find(x => x.id === p.dusId);
      if (d) {
        rId = d.rakId || "";
      }
    }
    setBulkDefaultRakId(rId);
    setBulkDefaultDusId(dId);
    setBulkRows((prev) =>
      prev.map((row) => ({
        ...row,
        rakId: rId,
        dusId: dId,
        pembungkusId: pId,
      }))
    );
  };

  const applyBulkDefaultUser = async (uId: string) => {
    setBulkDefaultUserId(uId);
    if (!uId) return;

    startTransition(async () => {
      const latestNum = await getLatestVoucherNumberForUser(uId);
      if (latestNum) {
        const nextNum = incrementDocumentNumber(latestNum);

        setBulkRows((prev) => {
          if (prev.length === 0) return prev;
          const updated = prev.map((r, index) => ({
            ...r,
            userId: uId,
            nomorBukti: index === 0 ? nextNum : r.nomorBukti,
          }));

          let currentNomor = nextNum;
          for (let i = 1; i < updated.length; i++) {
            currentNomor = incrementDocumentNumber(currentNomor);
            updated[i].nomorBukti = currentNomor;
          }

          return updated;
        });
        toast.success("Nomor bukti telah disesuaikan dengan seri user terpilih.");
      }
    });
  };

  const handleBulkAutoFillSerials = () => {
    setBulkRows((prev) => {
      if (prev.length === 0) return prev;
      const updated = [...prev];
      let currentNomor = updated[0].nomorBukti;
      for (let i = 1; i < updated.length; i++) {
        currentNomor = incrementDocumentNumber(currentNomor);
        updated[i].nomorBukti = currentNomor;
      }
      return updated;
    });
    toast.success("Nomor bukti berhasil diisi berurutan");
  };

  const handleBulkFillDown = () => {
    setBulkRows((prev) => {
      if (prev.length <= 1) return prev;
      const firstRow = prev[0];
      let currentNomor = firstRow.nomorBukti;

      return prev.map((row, index) => {
        if (index === 0) return row;
        currentNomor = incrementDocumentNumber(currentNomor);
        return {
          ...row,
          nomorBukti: currentNomor,
          tanggalBukti: firstRow.tanggalBukti,
          keterangan: firstRow.keterangan,
          rakId: firstRow.rakId,
          dusId: firstRow.dusId,
          pembungkusId: firstRow.pembungkusId,
        };
      });
    });
    toast.success("Menyalin data baris pertama ke semua baris");
  };

  const handleBulkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkRows.length === 0) return toast.error("Minimal harus menginput satu nota.");

    for (let i = 0; i < bulkRows.length; i++) {
      const r = bulkRows[i];
      if (!r.nomorBukti.trim()) return toast.error(`Baris ke-${i + 1}: Nomor Bukti wajib diisi.`);
      if (!r.tanggalBukti) return toast.error(`Baris ke-${i + 1}: Tanggal Transaksi wajib diisi.`);
      if (!r.pembungkusId) return toast.error(`Baris ke-${i + 1}: Map Lokasi wajib dipilih.`);
    }

    const formData = new FormData();
    const dataToSend = bulkRows.map((r) => ({
      nomorBukti: r.nomorBukti,
      tanggalBukti: r.tanggalBukti,
      keterangan: r.keterangan,
      pembungkusId: r.pembungkusId,
      userId: r.userId || bulkDefaultUserId || undefined,
      hasFile: false,
    }));

    formData.append("vouchers", JSON.stringify(dataToSend));

    startTransition(async () => {
      const res = await createVouchersBulk(formData);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Berhasil menyimpan ${res.count} nota secara massal.`);
        setBulkDialogOpen(false);
      }
    });
  };

  // Filtered lists for table search filters
  const filterDuses = dusList.filter((d) => !rakId || d.rakId === rakId);
  const filterPembungkuses = pembungkusList.filter((p) => !dusId || p.dusId === dusId);

  // Apply filters to URL query
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (rakId) params.set("rakId", rakId);
    if (dusId) params.set("dusId", dusId);
    if (pembungkusId) params.set("pembungkusId", pembungkusId);
    if (tahun) params.set("tahun", tahun);
    if (bulan) params.set("bulan", bulan);
    if (isVerified) params.set("isVerified", isVerified);
    if (statusKeberadaan) params.set("statusKeberadaan", statusKeberadaan);
    router.push(`${pathname}?${params.toString()}`);
  };

  // Reset filters
  const resetFilters = () => {
    setSearch("");
    setRakId("");
    setDusId("");
    setPembungkusId("");
    setTahun("");
    setBulan("");
    setIsVerified("");
    setStatusKeberadaan("");
    router.push(pathname);
  };

  // Auto-run filter application on changes (debounce search if needed, but simple triggers are fine)
  useEffect(() => {
    // Apply filters when dropdowns change
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (rakId) params.set("rakId", rakId);
    if (dusId) params.set("dusId", dusId);
    if (pembungkusId) params.set("pembungkusId", pembungkusId);
    if (tahun) params.set("tahun", tahun);
    if (bulan) params.set("bulan", bulan);
    if (isVerified) params.set("isVerified", isVerified);
    if (statusKeberadaan) params.set("statusKeberadaan", statusKeberadaan);
    router.push(`${pathname}?${params.toString()}`);
  }, [rakId, dusId, pembungkusId, tahun, bulan, isVerified, statusKeberadaan]);

  const openCreateDialog = () => {
    setDialogMode("create");
    setEditId(null);

    // Auto-suggest next nomorBukti
    let nextNomor = "";
    if (vouchers && vouchers.length > 0) {
      const latestVoucher = vouchers[0];
      if (latestVoucher && latestVoucher.nomorBukti) {
        nextNomor = incrementDocumentNumber(latestVoucher.nomorBukti);
      }
    }
    setFormNomor(nextNomor || "");

    setFormTanggal(new Date().toISOString().split("T")[0]);
    setFormKeterangan("");
    setFormUser(userList[0]?.id || "");
    setFormRakId("");
    setFormDusId("");
    setFormPembungkusId("");
    setDialogOpen(true);
  };

  const openEditDialog = (voucher: any) => {
    setDialogMode("edit");
    setEditId(voucher.id);
    setFormNomor(voucher.nomorBukti);
    setFormTanggal(new Date(voucher.tanggalBukti).toISOString().split("T")[0]);
    setFormKeterangan(voucher.keterangan || "");
    setFormUser(voucher.userId || "");
    
    // Set hierarchical selection based on current wrapper
    const pId = voucher.pembungkusId || "";
    setFormPembungkusId(pId);

    const pembungkus = pembungkusList.find((p) => p.id === pId);
    if (pembungkus) {
      setFormDusId(pembungkus.dusId || "unplaced");
      const dus = dusList.find((d) => d.id === pembungkus.dusId);
      if (dus) {
        setFormRakId(dus.rakId || "unplaced");
      } else {
        setFormRakId(pembungkus.dusId ? "" : "unplaced");
      }
    } else {
      setFormDusId("");
      setFormRakId("");
    }

    setDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formNomor.trim()) return toast.error("Nomor Bukti wajib diisi");
    if (!formTanggal) return toast.error("Tanggal Bukti wajib diisi");
    if (!formPembungkusId) return toast.error("Pembungkus wajib dipilih");
    if (!formUser) return toast.error("Petugas/User wajib dipilih");

    const formData = new FormData();
    formData.append("nomorBukti", formNomor);
    formData.append("tanggalBukti", formTanggal);
    formData.append("keterangan", formKeterangan);
    formData.append("pembungkusId", formPembungkusId);
    formData.append("userId", formUser);

    startTransition(async () => {
      let res: any;
      if (dialogMode === "create") {
        res = await createVoucher(null, formData);
      } else {
        res = await updateVoucher(editId!, null, formData);
      }

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success(`Berhasil ${dialogMode === "create" ? "mengarsipkan" : "memperbarui"} bukti pemindahbukuan`);
        setDialogOpen(false);
      }
    });
  };

  const handleDeleteTrigger = (id: string, nomorBukti: string) => {
    setVoucherIdToDelete(id);
    setVoucherNumberToDelete(nomorBukti);
    setIsOpenDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (!voucherIdToDelete) return;

    startTransition(async () => {
      const res = await deleteVoucher(voucherIdToDelete);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Arsip berhasil dihapus");
        setIsOpenDeleteConfirm(false);
        setVoucherIdToDelete(null);
        setVoucherNumberToDelete(null);
      }
    });
  };
  return (
    <div className="space-y-6">
      {/* Search & Advanced Filters Panel */}
      <Card className="border-border/40 rounded-2xl bg-card shadow-sm">
        <CardContent className="p-5 space-y-4">
          {/* Main search and buttons row */}
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                placeholder="Cari berdasarkan nomor bukti atau keterangan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                className="pl-9 pr-4 py-2 bg-background/50 border-border rounded-xl text-sm w-full"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={applyFilters}
                className="rounded-xl text-xs font-semibold px-4 flex items-center gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                Cari
              </Button>
              <Button
                variant="outline"
                onClick={resetFilters}
                className="rounded-xl text-xs font-semibold px-4"
              >
                Reset Filter
              </Button>
              <Button
                variant="outline"
                onClick={openBulkAddDialog}
                className="rounded-xl text-xs font-semibold px-4 flex items-center gap-1.5 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary shadow-sm ml-auto md:ml-0"
              >
                <FileText className="h-3.5 w-3.5" />
                Input Bulk
              </Button>
              <Button
                onClick={openCreateDialog}
                className="rounded-xl text-xs font-semibold px-4 flex items-center gap-1.5 shadow-md shadow-primary/10"
              >
                <Plus className="h-3.5 w-3.5" />
                Nota Baru
              </Button>
            </div>
          </div>

          <div className="h-px bg-border/30" />

          {/* Filtering dropdowns grid */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-7 lg:grid-cols-7">
            {/* Rak filter */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Filter Rak</Label>
              <select
                value={rakId}
                onChange={(e) => {
                  setRakId(e.target.value);
                  setDusId("");
                  setPembungkusId("");
                }}
                className="w-full bg-background border border-border text-foreground px-2 py-1.5 text-xs rounded-xl outline-none"
              >
                <option value="">Semua Rak</option>
                {rakList.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.namaRak}
                  </option>
                ))}
              </select>
            </div>

            {/* Dus filter */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Filter Dus</Label>
              <select
                value={dusId}
                onChange={(e) => {
                  setDusId(e.target.value);
                  setPembungkusId("");
                }}
                className="w-full bg-background border border-border text-foreground px-2 py-1.5 text-xs rounded-xl outline-none"
                disabled={!rakId && filterDuses.length === 0}
              >
                <option value="">Semua Dus</option>
                {filterDuses.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.namaDus}
                  </option>
                ))}
              </select>
            </div>

            {/* Pembungkus filter */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Filter Map</Label>
              <select
                value={pembungkusId}
                onChange={(e) => setPembungkusId(e.target.value)}
                className="w-full bg-background border border-border text-foreground px-2 py-1.5 text-xs rounded-xl outline-none"
                disabled={!dusId && filterPembungkuses.length === 0}
              >
                <option value="">Semua Map</option>
                {filterPembungkuses.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.namaPembungkus}
                  </option>
                ))}
              </select>
            </div>

            {/* Tahun Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Tahun</Label>
              <select
                value={tahun}
                onChange={(e) => setTahun(e.target.value)}
                className="w-full bg-background border border-border text-foreground px-2 py-1.5 text-xs rounded-xl outline-none"
              >
                <option value="">Semua</option>
                {Array.from(new Set(vouchers.map((v) => v.tahun))).sort().reverse().map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
                {/* Fallback to recent years if empty */}
                {vouchers.length === 0 && (
                  <>
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </>
                )}
              </select>
            </div>

            {/* Bulan Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Bulan</Label>
              <select
                value={bulan}
                onChange={(e) => setBulan(e.target.value)}
                className="w-full bg-background border border-border text-foreground px-2 py-1.5 text-xs rounded-xl outline-none"
              >
                <option value="">Semua</option>
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Admin Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Verifikasi (Admin)</Label>
              <select
                value={isVerified}
                onChange={(e) => setIsVerified(e.target.value)}
                className="w-full bg-background border border-border text-foreground px-2 py-1.5 text-xs rounded-xl outline-none"
              >
                <option value="">Semua</option>
                <option value="false">Belum Diperiksa</option>
                <option value="true">Sudah Diperiksa</option>
              </select>
            </div>

            {/* Keberadaan / Peminjaman Filter */}
            <div className="space-y-1">
              <Label className="text-[10px] font-semibold text-muted-foreground uppercase">Keberadaan Arsip</Label>
              <select
                value={statusKeberadaan}
                onChange={(e) => setStatusKeberadaan(e.target.value)}
                className="w-full bg-background border border-border text-foreground px-2 py-1.5 text-xs rounded-xl outline-none"
              >
                <option value="">Semua</option>
                <option value="tersedia">Tersedia di Rak</option>
                <option value="dipinjam">Sedang Dipinjam</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vouchers Data Table */}
      <Card className="border-border/40 rounded-2xl bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/30 hover:bg-transparent bg-secondary/10">
              <TableHead className="font-semibold text-xs text-muted-foreground">Nomor Bukti</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground">Tanggal</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground">Lokasi</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground text-center">Verifikasi</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground text-center">Fisik</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground text-center">Scan</TableHead>
              <TableHead className="font-semibold text-xs text-muted-foreground text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vouchers.length > 0 ? (
              vouchers.map((voucher) => {
                const activeLoans = voucher.peminjamans?.filter((l: any) => l.status === "DIPINJAM") || [];
                const isFullyBorrowed = activeLoans.some((l: any) => l.isFullVoucher);
                return (
                  <TableRow key={voucher.id} className="border-border/20 hover:bg-secondary/15 transition-all">
                    <TableCell className="font-bold text-sm text-foreground">
                      <button
                        onClick={() => router.push(`/dashboard/vouchers/${voucher.id}`)}
                        className="hover:underline hover:text-primary transition-colors text-left font-bold cursor-pointer"
                      >
                        {voucher.nomorBukti}
                      </button>
                    </TableCell>
                    <TableCell className="text-xs text-foreground">
                      <span className="font-semibold">{voucher.hari}</span>,{" "}
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(voucher.tanggalBukti))}
                    </TableCell>
                    <TableCell className="text-xs">
                      {voucher.pembungkus ? (
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => router.push(`/dashboard/locations?tab=pembungkus&search=${encodeURIComponent(voucher.pembungkus.namaPembungkus)}`)}
                            className="font-semibold text-foreground flex items-center gap-1 hover:underline hover:text-emerald-500 transition-colors text-left cursor-pointer"
                          >
                            <Layers className="h-3 w-3 text-emerald-500" />
                            {voucher.pembungkus.namaPembungkus}
                          </button>
                          {voucher.pembungkus.dus && (
                            <div className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-1 pl-4">
                              <FolderOpen className="h-2.5 w-2.5 text-amber-500" />
                              <button
                                onClick={() => router.push(`/dashboard/locations?tab=dus&search=${encodeURIComponent(voucher.pembungkus.dus.namaDus)}`)}
                                className="hover:underline hover:text-amber-500 transition-colors cursor-pointer"
                              >
                                {voucher.pembungkus.dus.namaDus}
                              </button>
                              {voucher.pembungkus.dus.rak && (
                                <>
                                  <span>•</span>
                                  <MapPin className="h-2.5 w-2.5 text-primary" />
                                  <button
                                    onClick={() => router.push(`/dashboard/locations?tab=rak&search=${encodeURIComponent(voucher.pembungkus.dus.rak.namaRak)}`)}
                                    className="hover:underline hover:text-primary transition-colors cursor-pointer"
                                  >
                                    {voucher.pembungkus.dus.rak.namaRak}
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic">Belum disimpan</span>
                      )}
                    </TableCell>

                    <TableCell className="text-center">
                      {voucher.isVerified ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                          Sesuai
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          <Loader2 className="h-3 w-3 animate-pulse text-amber-500" />
                          Belum Diperiksa
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {activeLoans.length > 0 ? (
                        isFullyBorrowed ? (
                          <span
                            className="inline-flex items-center gap-1 bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-help"
                            title={activeLoans.map((l: any) => `Dipinjam oleh ${l.namaPeminjam} (${l.divisiPeminjam})`).join("\n")}
                          >
                            Dipinjam
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-help"
                            title={activeLoans.map((l: any) => `Dipinjam oleh ${l.namaPeminjam} (${l.divisiPeminjam})`).join("\n")}
                          >
                            Dipinjam Sebagian
                          </span>
                        )
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Ada di Rak
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {voucher.dokumens && voucher.dokumens.length > 0 ? (
                        <button
                          onClick={() => router.push(`/dashboard/vouchers/${voucher.id}`)}
                          className="inline-flex items-center gap-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer transition-colors"
                        >
                          <FileText className="h-3 w-3" />
                          {voucher.dokumens.length} Berkas
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-secondary text-muted-foreground border border-border px-2 py-0.5 rounded-full text-[10px] font-semibold">
                          <EyeOff className="h-3 w-3" />
                          Kosong
                        </span>
                      )}
                    </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-lg text-primary hover:bg-primary/10"
                        onClick={() => router.push(`/dashboard/vouchers/${voucher.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                        onClick={() => openEditDialog(voucher)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteTrigger(voucher.id, voucher.nomorBukti)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })) : (
              <TableRow>
                <TableCell colSpan={8} className="h-40 text-center text-xs text-muted-foreground">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="h-8 w-8 text-muted-foreground/30" />
                    Tidak ada bukti pemindahbukuan ditemukan
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>      {/* CREATE & EDIT ARCHIVE MODAL */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[620px] md:max-w-[660px] max-h-[90vh] rounded-2xl border-border/50 bg-card/95 backdrop-blur-md overflow-hidden p-6 flex flex-col gap-4">
          <DialogHeader className="pb-1 flex-shrink-0">
            <DialogTitle className="text-lg font-bold">
              {dialogMode === "create" ? "Arsipkan Nota Baru" : "Edit Arsip Nota"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Lengkapi form berikut dengan benar untuk memetakan dokumen fisik ke dalam sistem e-arsip.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto pr-1.5 py-1 space-y-5 max-h-[60vh] sm:max-h-[65vh]">


              {/* Row 1: Nomor Bukti & Tanggal Transaksi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nomor Bukti */}
                <div className="space-y-1.5">
                  <Label htmlFor="nomorBukti" className="text-xs font-semibold text-foreground/80">Nomor Bukti / JV</Label>
                  <Input
                    id="nomorBukti"
                    value={formNomor}
                    onChange={(e) => setFormNomor(e.target.value)}
                    placeholder="01100001"
                    required
                    className="bg-background border-border rounded-xl text-sm h-10 px-3 hover:border-border/80 focus:ring-1 focus:ring-primary transition-all"
                    disabled={isPending}
                  />
                </div>

                {/* Tanggal Bukti */}
                <div className="space-y-1.5">
                  <Label htmlFor="tanggalBukti" className="text-xs font-semibold text-foreground/80">
                    Tanggal Transaksi {formTanggal && (
                      <span className="text-[10px] text-primary font-bold ml-1">
                        ({getIndonesianDayName(formTanggal)})
                      </span>
                    )}
                  </Label>
                  <Input
                    id="tanggalBukti"
                    type="date"
                    value={formTanggal}
                    onChange={(e) => setFormTanggal(e.target.value)}
                    required
                    className="bg-background border-border rounded-xl text-sm h-10 px-3 hover:border-border/80 focus:ring-1 focus:ring-primary transition-all"
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Row 2: Petugas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Petugas / User Selector */}
                <div className="space-y-1.5">
                  <Label htmlFor="formUserSelect" className="text-xs font-semibold text-foreground/80">
                    Petugas Arsip
                  </Label>
                  <select
                    id="formUserSelect"
                    value={formUser}
                    onChange={(e) => setFormUser(e.target.value)}
                    className="w-full bg-background border border-border text-foreground px-3 py-2.5 text-xs rounded-xl outline-none hover:border-border/80 focus:ring-1 focus:ring-primary transition-all h-10"
                    required
                    disabled={isPending}
                  >
                    <option value="">Pilih Petugas</option>
                    {userList.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 4: Hierarchical Physical Location Selectors */}
              <div className="p-4 bg-secondary/25 border border-border/40 rounded-xl space-y-3.5">
                <div className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-primary" />
                  Penentuan Lokasi Arsip Fisik (Alur Bertingkat)
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                  {/* Rak */}
                  <div className="flex-1 space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <span className="bg-primary/10 text-primary w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold">1</span>
                      Pilih Rak
                    </Label>
                    <select
                      value={formRakId}
                      onChange={(e) => {
                        setFormRakId(e.target.value);
                        setFormDusId("");
                        setFormPembungkusId("");
                      }}
                      className="w-full bg-background border border-border text-foreground px-2.5 py-1.5 text-xs rounded-xl outline-none hover:border-primary/40 focus:ring-1 focus:ring-primary transition-all h-9 cursor-pointer"
                      disabled={isPending}
                    >
                      <option value="">Pilih Lemari Rak...</option>
                      <option value="unplaced">-- Dus Tanpa Rak --</option>
                      {rakList.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.namaRak}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ChevronRight className={`h-4 w-4 hidden sm:block mt-4 flex-shrink-0 ${formRakId ? "text-primary animate-pulse" : "text-muted-foreground/35"}`} />

                  {/* Dus */}
                  <div className="flex-1 space-y-1">
                    <Label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                      <span className="bg-primary/10 text-primary w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold">2</span>
                      Pilih Dus (Box)
                    </Label>
                    <select
                      value={formDusId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormDusId(val);
                        setFormPembungkusId("");
                        if (val && val !== "unplaced") {
                          const chosen = dusList.find((d) => d.id === val);
                          if (chosen) {
                            setFormRakId(chosen.rakId || "unplaced");
                          }
                        }
                      }}
                      className="w-full bg-background border border-border text-foreground px-2.5 py-1.5 text-xs rounded-xl outline-none hover:border-primary/40 focus:ring-1 focus:ring-primary transition-all h-9 cursor-pointer"
                      disabled={isPending}
                    >
                      <option value="">Pilih Dus...</option>
                      <option value="unplaced">-- Map Tanpa Dus --</option>
                      {formDuses.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.namaDus} {!formRakId && `(${d.rak?.namaRak || "Tanpa Rak"})`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <ChevronRight className={`h-4 w-4 hidden sm:block mt-4 flex-shrink-0 ${formDusId ? "text-primary animate-pulse" : "text-muted-foreground/35"}`} />

                  {/* Pembungkus */}
                  <div className="flex-1 space-y-1">
                    <Label className={`text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${!formDusId ? "text-muted-foreground/50" : "text-muted-foreground"}`}>
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold ${!formDusId ? "bg-muted text-muted-foreground/60" : "bg-primary/10 text-primary"}`}>3</span>
                      Pilih Map (Pembungkus)
                    </Label>
                    <select
                      value={formPembungkusId}
                      onChange={(e) => setFormPembungkusId(e.target.value)}
                      className={`w-full bg-background border border-border text-foreground px-2.5 py-1.5 text-xs rounded-xl outline-none transition-all h-9 ${
                        !formDusId
                          ? "opacity-50 cursor-not-allowed bg-secondary/15 border-dashed"
                          : "hover:border-primary/40 focus:ring-1 focus:ring-primary cursor-pointer"
                      }`}
                      disabled={isPending || !formDusId}
                      required
                    >
                      <option value="">{formDusId ? "Pilih Map..." : "🚫 Pilih Dus dahulu"}</option>
                      {formPembungkuses.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.namaPembungkus}
                        </option>
                      ))}
                    </select>
                    {!formDusId && (
                      <p className="text-[8px] text-muted-foreground/75 leading-none pl-1 mt-0.5">Pilih Dus atau "Map Tanpa Dus" untuk membuka</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Row 5: Keterangan */}
              <div className="space-y-1.5">
                <Label htmlFor="keterangan" className="text-xs font-semibold text-foreground/80">Keterangan / Deskripsi Transaksi</Label>
                <Textarea
                  id="keterangan"
                  value={formKeterangan}
                  onChange={(e) => setFormKeterangan(e.target.value)}
                  placeholder="Deskripsikan tujuan atau isi dari bukti pemindahbukuan ini..."
                  className="bg-background border-border rounded-xl text-sm min-h-[80px] hover:border-border/80 focus:ring-1 focus:ring-primary transition-all"
                  disabled={isPending}
                />
              </div>
            </div>

            <DialogFooter className="pt-4 mt-2 border-t border-border/20 gap-2 sm:gap-0 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl font-semibold text-xs h-10 px-4"
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl font-semibold text-xs bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/10 h-10 px-5"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
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

      {/* BULK ADD ARCHIVE MODAL */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-[98vw] sm:max-w-[98vw] w-[1450px] sm:w-[1450px] max-h-[96vh] rounded-2xl border-border/50 bg-card/95 backdrop-blur-md overflow-hidden p-6 md:p-8 flex flex-col gap-5">
          <DialogHeader className="pb-1 flex-shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-lg font-bold flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                  Input Bulk Nota (Spreadsheet Style)
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Masukkan banyak nota sekaligus dalam format tabel Excel. Gunakan alat otomatisasi di bawah untuk menghemat waktu penginputan.
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBulkAutoFillSerials}
                  className="rounded-xl text-xs font-semibold px-3 h-8 flex items-center gap-1.5 hover:bg-primary/5 hover:text-primary transition-all border-primary/20 text-primary cursor-pointer h-9"
                  title="Mengisi nomor bukti baris di bawah secara berurutan +1 dari baris pertama"
                >
                  <FolderTree className="h-3.5 w-3.5" />
                  Isi Seri Berurutan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBulkFillDown}
                  className="rounded-xl text-xs font-semibold px-3 h-8 flex items-center gap-1.5 hover:bg-primary/5 hover:text-primary transition-all border-primary/20 text-primary cursor-pointer h-9"
                  title="Menyalin tanggal, keterangan, dan lokasi baris pertama ke semua baris di bawahnya (sambil mengurutkan nomor seri)"
                >
                  <Layers className="h-3.5 w-3.5" />
                  Salin Baris 1 ke Semua
                </Button>
              </div>
            </div>
          </DialogHeader>

          {/* Defaults panel */}
          <div className="p-3.5 bg-secondary/15 border border-border/30 rounded-xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0 text-xs">
            {/* Default Date */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Tanggal Default</Label>
              <Input
                type="date"
                value={bulkDefaultDate}
                onChange={(e) => applyBulkDefaultDate(e.target.value)}
                className="h-9 text-xs rounded-xl"
              />
            </div>

            {/* Default User selection */}
            <div className="space-y-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Pilih User / Seri Default</Label>
              <select
                value={bulkDefaultUserId}
                onChange={(e) => applyBulkDefaultUser(e.target.value)}
                className="w-full bg-background border border-border text-foreground px-2.5 py-1 text-xs rounded-xl outline-none h-9 cursor-pointer"
                disabled={isPending}
              >
                <option value="">-- Pilih User --</option>
                {userList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.username})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Default Location Map selection */}
            <div className="space-y-1 sm:col-span-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase">Pilih Lokasi Map Default (Terapkan ke Semua)</Label>
              <select
                value={bulkDefaultPembungkusId}
                onChange={(e) => applyBulkDefaultLocation(e.target.value)}
                className="w-full bg-background border border-border text-foreground px-2.5 py-1 text-xs rounded-xl outline-none h-9 cursor-pointer"
              >
                <option value="">-- Pilih Map (Lokasi Fisik) --</option>
                {pembungkusList.map((p) => {
                  let pathStr = p.namaPembungkus;
                  if (p.dus) {
                    pathStr = `${p.dus.namaDus} → ${pathStr}`;
                    if (p.dus.rak) {
                      pathStr = `${p.dus.rak.namaRak} → ${pathStr}`;
                    }
                  }
                  return (
                    <option key={p.id} value={p.id}>
                      {pathStr}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <form onSubmit={handleBulkSave} className="flex-1 flex flex-col min-h-0">
            {/* Spreadsheet Table Container */}
            <div className="flex-1 overflow-x-auto overflow-y-auto border border-border/40 rounded-xl bg-background/50 max-h-[58vh] min-h-[300px]">
              <Table className="min-w-[1250px] text-xs">
                <TableHeader className="bg-secondary/10 sticky top-0 z-10 backdrop-blur-md">
                  <TableRow className="border-border/30 hover:bg-transparent">
                    <TableHead className="w-14 text-center font-bold">#</TableHead>
                    <TableHead className="w-60 font-bold">Nomor Bukti</TableHead>
                    <TableHead className="w-40 font-bold">Tanggal</TableHead>
                    <TableHead className="font-bold">Keterangan</TableHead>
                    <TableHead className="w-80 font-bold">Lokasi Map</TableHead>
                    <TableHead className="w-12 text-center font-bold"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bulkRows.map((row, index) => (
                    <TableRow key={row.id} className="border-border/20 hover:bg-secondary/5 transition-colors">
                      <TableCell className="text-center font-semibold text-muted-foreground">{index + 1}</TableCell>
                      
                      {/* Nomor Bukti */}
                      <TableCell>
                        <Input
                          value={row.nomorBukti}
                          onChange={(e) => handleBulkRowChange(row.id, "nomorBukti", e.target.value)}
                          placeholder="01100001"
                          required
                          className="h-8.5 text-xs rounded-lg border-border focus:ring-1 focus:ring-primary w-full"
                          disabled={isPending}
                        />
                      </TableCell>

                      {/* Tanggal */}
                      <TableCell>
                        <Input
                          type="date"
                          value={row.tanggalBukti}
                          onChange={(e) => handleBulkRowChange(row.id, "tanggalBukti", e.target.value)}
                          required
                          className="h-8.5 text-xs rounded-lg border-border focus:ring-1 focus:ring-primary w-full"
                          disabled={isPending}
                        />
                      </TableCell>



                      {/* Keterangan */}
                      <TableCell>
                        <Input
                          value={row.keterangan}
                          onChange={(e) => handleBulkRowChange(row.id, "keterangan", e.target.value)}
                          placeholder="Keterangan transaksi..."
                          className="h-8.5 text-xs rounded-lg border-border focus:ring-1 focus:ring-primary w-full"
                          disabled={isPending}
                        />
                      </TableCell>

                      {/* Lokasi Map cascading dropdowns or simple selector */}
                      <TableCell>
                        <select
                          value={row.pembungkusId}
                          onChange={(e) => handleBulkRowChange(row.id, "pembungkusId", e.target.value)}
                          required
                          className="bg-background border border-border text-foreground px-2 py-1.5 text-xs rounded-lg outline-none h-8.5 w-full cursor-pointer"
                          disabled={isPending}
                        >
                          <option value="">-- Pilih Map --</option>
                          {pembungkusList.map((p) => {
                            let pathStr = p.namaPembungkus;
                            if (p.dus) {
                              pathStr = `${p.dus.namaDus} → ${pathStr}`;
                              if (p.dus.rak) {
                                pathStr = `${p.dus.rak.namaRak} → ${pathStr}`;
                              }
                            }
                            return (
                              <option key={p.id} value={p.id}>
                                {pathStr}
                              </option>
                            );
                          })}
                        </select>
                      </TableCell>



                      {/* Delete Row Button */}
                      <TableCell className="text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleBulkRemoveRow(row.id)}
                          className="h-8 w-8 rounded-lg text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                          title="Hapus baris"
                          disabled={bulkRows.length <= 1}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Bulk Add Controls */}
            <div className="flex items-center justify-between pt-3 border-t border-border/10 mt-2 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={handleBulkAddRow}
                className="rounded-xl text-xs font-semibold px-4 h-9 flex items-center gap-1.5 cursor-pointer"
                disabled={isPending}
              >
                <Plus className="h-4 w-4" />
                Tambah Baris Baru
              </Button>
              <div className="text-xs text-muted-foreground font-semibold">
                Total: <span className="text-foreground font-bold">{bulkRows.length}</span> Nota siap disimpan.
              </div>
            </div>

            {/* Bulk Save Actions */}
            <DialogFooter className="pt-4 border-t border-border/20 gap-2 sm:gap-0 mt-4 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBulkDialogOpen(false)}
                className="rounded-xl font-semibold text-xs h-10 px-4 animate-none"
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl font-semibold text-xs bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/10 h-10 px-5"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Menyimpan massal...
                  </>
                ) : (
                  `Simpan Semua (${bulkRows.length} Nota)`
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isOpenDeleteConfirm} onOpenChange={setIsOpenDeleteConfirm}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              Hapus Arsip Nota?
            </DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">
              Apakah Anda yakin ingin menghapus arsip bukti pemindahbukuan dengan nomor bukti <span className="font-semibold text-foreground">{voucherNumberToDelete}</span> secara permanen? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsOpenDeleteConfirm(false); setVoucherIdToDelete(null); setVoucherNumberToDelete(null); }}
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
