import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  FolderTree,
  FolderOpen,
  Layers,
  User as UserIcon,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import VoucherDetailActions from "@/components/voucher-detail-actions";
import NotaDocumentManager from "@/components/nota-document-manager";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}


export default async function VoucherDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [voucher, currentUser, rawDivisions] = await Promise.all([
    prisma.nota.findUnique({
      where: { id },
      include: {
        pembungkus: {
          include: {
            dus: {
              include: {
                rak: true,
              },
            },
          },
        },
        user: {
          select: { name: true, username: true },
        },
        verifiedBy: {
          select: { name: true, username: true },
        },
        peminjamans: {
          include: {
            dokumens: true,
          },
          orderBy: { createdAt: "desc" },
        },
        dokumens: {
          orderBy: { order: "asc" },
        },
      },
    }),
    getCurrentUser(),
    prisma.divisi.findMany({
      orderBy: { namaDivisi: "asc" },
    }),
  ]);

  if (!voucher) {
    notFound();
  }

  const userRole = currentUser?.role || "ADMIN";
  const activeLoan = voucher.peminjamans.find((l: any) => l.status === "DIPINJAM") || null;
  const divisionsList = JSON.parse(JSON.stringify(rawDivisions));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-2xs text-muted-foreground font-semibold uppercase tracking-wider">
          <Link href="/dashboard/vouchers" className="hover:text-primary transition-colors">
            Arsip Nota
          </Link>
          <span>/</span>
          <span className="text-foreground">Detail</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-1">
          <div className="flex items-center gap-3.5">
            <Button asChild variant="outline" size="icon-sm" className="rounded-xl shadow-sm cursor-pointer">
              <Link href="/dashboard/vouchers">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-mono text-foreground">
                  {voucher.nomorBukti}
                </h1>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Dibuat pada {new Date(voucher.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })} oleh <strong className="text-foreground">{voucher.user?.name || "Sistem"}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Controls & Statuses Component */}
      <VoucherDetailActions
        voucherId={voucher.id}
        isVerified={voucher.isVerified}
        verifiedBy={voucher.verifiedBy}
        verifiedAt={voucher.verifiedAt ? voucher.verifiedAt.toISOString() : null}
        userRole={userRole}
        activeLoans={voucher.peminjamans
          .filter((l: any) => l.status === "DIPINJAM")
          .map((l: any) => ({
            id: l.id,
            namaPeminjam: l.namaPeminjam,
            divisiPeminjam: l.divisiPeminjam,
            tanggalPinjam: l.tanggalPinjam.toISOString(),
            keterangan: l.keterangan,
            isFullVoucher: l.isFullVoucher,
            dokumenIds: l.dokumens?.map((d: any) => d.id) || [],
          }))}
        allDocuments={JSON.parse(JSON.stringify(voucher.dokumens))}
        divisions={divisionsList}
      />

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column - Details */}
        <div className="space-y-6 lg:col-span-5">
          {/* Main Info */}
          <Card className="border-border/40 rounded-2xl bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Informasi Umum
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-secondary/35 border border-border/30 rounded-xl space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold flex items-center gap-1">
                  <Calendar className="h-3 w-3 text-primary" />
                  Tanggal Transaksi
                </span>
                <p className="text-xs font-bold text-foreground">
                  {voucher.hari},{" "}
                  {new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
                    new Date(voucher.tanggalBukti)
                  )}
                </p>
              </div>

              {/* Description */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                  Keterangan / Deskripsi
                </span>
                <p className="text-xs bg-secondary/20 border border-border/30 p-3 rounded-xl text-foreground font-medium min-h-[70px] whitespace-pre-wrap leading-relaxed">
                  {voucher.keterangan || "Tidak ada keterangan tambahan."}
                </p>
              </div>

              {/* Archiver Info */}
              <div className="flex items-center gap-2 pt-2 text-2xs text-muted-foreground border-t border-border/30">
                <UserIcon className="h-3.5 w-3.5" />
                <span>
                  Petugas Pengarsip: <strong className="text-foreground">{voucher.user.name}</strong> ({voucher.user.username})
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Physical Location Map Trail */}
          <Card className="border-border/40 rounded-2xl bg-card shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Lokasi Penyimpanan Fisik
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-3.5">
                <div className="text-[10px] font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  Alur Pemetaan Penyimpanan
                </div>

                <div className="flex flex-col gap-1">
                  {/* Step 1: Shelf */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                      <FolderTree className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Lemari Rak</p>
                      <p className="text-sm font-bold text-foreground">
                        {voucher.pembungkus?.dus?.rak?.namaRak || "Belum ditempatkan"}
                      </p>
                    </div>
                  </div>

                  {/* Connecting Arrow */}
                  <div className="h-4 w-0.5 bg-primary/30 ml-4" />

                  {/* Step 2: Box */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-amber-500 flex items-center justify-center text-white shadow-sm">
                      <FolderOpen className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Dus (Box)</p>
                      <p className="text-sm font-bold text-foreground">
                        {voucher.pembungkus?.dus?.namaDus || "Belum dimasukkan dus"}
                      </p>
                    </div>
                  </div>

                  {/* Connecting Arrow */}
                  <div className="h-4 w-0.5 bg-amber-500/30 ml-4" />

                  {/* Step 3: Envelope / Map */}
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-sm">
                      <Layers className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase">Map (Pembungkus)</p>
                      <p className="text-sm font-bold text-foreground">
                        {voucher.pembungkus?.namaPembungkus || "Belum dibungkus"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - File Preview / Document Manager */}
        <div className="lg:col-span-7">
          <NotaDocumentManager
            notaId={voucher.id}
            initialDocuments={JSON.parse(JSON.stringify(voucher.dokumens))}
            activeLoans={JSON.parse(JSON.stringify(voucher.peminjamans.filter((l: any) => l.status === "DIPINJAM")))}
            divisions={divisionsList}
          />
        </div>
      </div>

      {/* Bottom Full-Width Column - Borrowing History Table (Audit Trail) */}
      <Card className="border-border/40 rounded-2xl bg-card shadow-sm overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Riwayat Peminjaman & Sirkulasi Fisik (Audit Trail)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {voucher.peminjamans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border/30 hover:bg-transparent bg-secondary/10">
                  <TableHead className="font-semibold text-xs text-muted-foreground">Tanggal Pinjam</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Nama Peminjam</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Divisi / Unit</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Keterangan / Keperluan</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground">Tanggal Kembali</TableHead>
                  <TableHead className="font-semibold text-xs text-muted-foreground text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {voucher.peminjamans.map((loan: any) => (

                  <TableRow key={loan.id} className="border-border/20 text-xs">
                    <TableCell className="font-medium text-foreground">
                      {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(loan.tanggalPinjam))}
                    </TableCell>
                    <TableCell className="font-bold text-foreground">{loan.namaPeminjam}</TableCell>
                    <TableCell className="text-muted-foreground">{loan.divisiPeminjam}</TableCell>
                    <TableCell className="text-muted-foreground italic" title={loan.keterangan || ""}>
                      {loan.keterangan || "-"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {loan.tanggalKembali ? (
                        new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(loan.tanggalKembali))
                      ) : (
                        <span className="text-destructive font-bold animate-pulse">Sedang Keluar</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {loan.status === "DIPINJAM" ? (
                        <span className="inline-flex bg-destructive/10 text-destructive border border-destructive/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Dipinjam
                        </span>
                      ) : (
                        <span className="inline-flex bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-bold">
                          Kembali
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-xs text-muted-foreground italic border-t border-border/30 bg-secondary/5">
              Belum ada riwayat peminjaman atau sirkulasi untuk dokumen fisik nota ini.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
