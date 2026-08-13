import Link from "next/link";
import type { Metadata } from "next";
import { getDashboardStats } from "@/app/actions/voucher-actions";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileSpreadsheet,
  FolderTree,
  FolderOpen,
  Layers,
  ArrowUpRight,
  PlusCircle,
  MapPin,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";


function formatTanggal(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
  }).format(d);
}

interface RecentVoucher {
  id: string;
  nomorBukti: string;
  tanggalBukti: Date | string;
  user: {
    name: string;
  };
  pembungkus?: {
    dus?: {
      namaDus: string;
      rak?: {
        namaRak: string;
      } | null;
    } | null;
  } | null;
}

interface DashboardStats {
  totalVouchers: number;
  totalRak: number;
  totalDus: number;
  totalPembungkus: number;
  totalUnverified: number;
  totalVerified: number;
  totalBorrowed: number;
  totalAvailable: number;
  vouchersByYear: { tahun: string; count: number }[];
  recentVouchers: RecentVoucher[];
}

export const metadata: Metadata = {
  title: "Ringkasan Arsip | e-Arsip BSG",
  description: "Dashboard ringkasan sirkulasi dan status arsip nota pemindahbukuan Bank SulutGo",
};

export default async function DashboardPage() {
  const stats = await getDashboardStats() as DashboardStats;

  const kpis = [
    {
      title: "Total Arsip Nota",
      value: stats.totalVouchers,
      description: `${stats.totalVerified || 0} Terverifikasi • ${stats.totalBorrowed || 0} Dipinjam`,
      icon: FileSpreadsheet,
      color: "text-primary bg-primary/10",
    },
    {
      title: "Rak Penyimpanan",
      value: stats.totalRak,
      description: "Lokasi fisik (lemari rak)",
      icon: FolderTree,
      color: "text-blue-500 bg-blue-500/10",
    },
    {
      title: "Dus Arsip",
      value: stats.totalDus,
      description: "Box penampung berkas",
      icon: FolderOpen,
      color: "text-amber-500 bg-amber-500/10",
    },
    {
      title: "Pembungkus",
      value: stats.totalPembungkus,
      description: "Map / Amplop berkas",
      icon: Layers,
      color: "text-emerald-500 bg-emerald-500/10",
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Ringkasan Arsip</h2>
          <p className="text-sm text-muted-foreground">
            NOTA PEMINDAHBUKUAN
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild size="sm" className="rounded-xl font-semibold shadow-md shadow-primary/10">
            <Link href="/dashboard/vouchers">
              <PlusCircle className="mr-2 h-4 w-4" />
              Nota Baru
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="rounded-xl font-semibold">
            <Link href="/dashboard/locations">
              <MapPin className="mr-2 h-4 w-4" />
              Kelola Rak
            </Link>
          </Button>
        </div>
      </div>

      {/* Circulation Status Highlight (Striking UI/UX) */}
      {stats.totalBorrowed > 0 ? (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-sm">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="flex items-center gap-4.5 relative z-10">
            <div className="h-14 w-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0 animate-pulse">
              <FileSpreadsheet className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-widest text-amber-600 dark:text-amber-400 uppercase">
                  Perhatian Peminjaman
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
              </div>
              <h3 className="text-xl font-extrabold text-foreground mt-0.5">
                {stats.totalBorrowed} Berkas Nota Sedang Dipinjam
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-[550px] leading-relaxed">
                Terdapat <span className="font-bold text-foreground">{stats.totalBorrowed} slip arsip nota</span> yang statusnya belum dikembalikan ke lemari rak. Harap pastikan sirkulasi dokumen ini terpantau secara berkala.
              </p>
            </div>
          </div>

          <Button
            asChild
            className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs h-10 px-5 shadow-lg shadow-amber-500/15 shrink-0 z-10"
          >
            <Link href="/dashboard/vouchers?statusKeberadaan=dipinjam" className="flex items-center gap-1.5">
              Pantau Peminjaman
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-5 flex items-center gap-4 flex-row shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Semua Dokumen Aman</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Seluruh slip nota saat ini tersedia lengkap di dalam rak penyimpanan fisik.
            </p>
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-border/40 shadow-sm rounded-2xl bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {kpi.title}
              </span>
              <div className={`p-2 rounded-xl ${kpi.color}`}>
                <kpi.icon className="h-4.5 w-4.5" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{kpi.value}</div>
              <p className="text-2xs text-muted-foreground mt-1">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>


      <div className="grid gap-6 md:grid-cols-6">
        {/* Trend Bar Chart */}
        <Card className="col-span-1 md:col-span-3 border-border/40 shadow-sm rounded-2xl bg-card">
          <CardHeader>
            <CardTitle className="text-base font-bold">Tren Kuantitas Arsip</CardTitle>
            <CardDescription className="text-2xs">Jumlah berkas terarsip per tahun</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex items-center justify-center overflow-x-auto">
            {stats.vouchersByYear.length > 0 ? (
              <div className="w-full h-full flex flex-col justify-between min-w-[320px]">
                <div className="flex-1 flex items-end gap-6 pt-4 border-b border-l border-border/60 px-4">
                  {stats.vouchersByYear.map((item) => {
                    const maxVal = Math.max(...stats.vouchersByYear.map((v) => v.count), 1);
                    const heightPercent = `${(item.count / maxVal) * 80 + 10}%`;
                    return (
                      <div key={item.tahun} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer min-w-[45px]">
                        <div
                          className="w-full bg-primary/30 group-hover:bg-primary/60 rounded-t-lg transition-all duration-200 relative flex items-end justify-center"
                          style={{ height: heightPercent }}
                        >
                          <span className="absolute -top-7 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-1.5 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-sm">
                            {item.count}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-muted-foreground">
                          {item.tahun}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground flex flex-col items-center gap-2">
                <CalendarDays className="h-8 w-8 text-muted-foreground/50" />
                Belum ada data statistik arsip
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Uploads Table */}
        <Card className="col-span-1 md:col-span-3 border-border/40 shadow-sm rounded-2xl bg-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Arsip Terbaru</CardTitle>
              <CardDescription className="text-2xs">5 aktivitas pengarsipan terakhir</CardDescription>
            </div>
            <Button asChild variant="ghost" size="xs" className="text-xs font-semibold rounded-lg text-primary">
              <Link href="/dashboard/vouchers" className="flex items-center gap-1">
                Semua
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="px-0">
            {stats.recentVouchers.length > 0 ? (
              <div className="divide-y divide-border/30">
                {stats.recentVouchers.map((voucher) => (
                  <div key={voucher.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-secondary/20 transition-colors">
                    <div className="space-y-1 truncate max-w-[65%]">
                      <p className="text-xs font-bold text-foreground truncate">
                        {voucher.nomorBukti}
                      </p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                        <span>{formatTanggal(voucher.tanggalBukti)}</span>
                        <span>•</span>
                        <span className="font-semibold text-primary truncate max-w-[150px]">
                          {voucher.pembungkus?.dus?.rak?.namaRak || "Tanpa Rak"} &gt;{" "}
                          {voucher.pembungkus?.dus?.namaDus || "Tanpa Dus"}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">
                        diarsip oleh {voucher.user?.name ? voucher.user.name.split(" ")[0] : "Petugas"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-xs text-muted-foreground gap-2">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground/30" />
                Belum ada aktivitas pengarsipan
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
