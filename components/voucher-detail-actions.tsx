"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  LogOut,
  LogIn,
  Loader2,
  Building,
  User as UserIcon,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { verifyVoucher, unverifyVoucher, borrowVoucher, returnVoucher } from "@/app/actions/voucher-actions";

interface VoucherDetailActionsProps {
  voucherId: string;
  isVerified: boolean;
  verifiedBy?: { name: string; username: string } | null;
  verifiedAt?: string | null;
  userRole: string; // "ADMIN"
  activeLoans: {
    id: string;
    namaPeminjam: string;
    divisiPeminjam: string;
    tanggalPinjam: string;
    keterangan?: string | null;
    isFullVoucher: boolean;
    dokumenIds: string[];
  }[];
  allDocuments: {
    id: string;
    fileName: string;
    filePath: string;
    order: number;
  }[];
  divisions: { id: string; namaDivisi: string }[];
}

export default function VoucherDetailActions({
  voucherId,
  isVerified,
  verifiedBy,
  verifiedAt,
  userRole,
  activeLoans = [],
  allDocuments = [],
  divisions = [],
}: VoucherDetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [borrowDialogOpen, setBorrowDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  // Form states
  const [namaPeminjam, setNamaPeminjam] = useState("");
  const [divisiPeminjam, setDivisiPeminjam] = useState("");
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [keperluan, setKeperluan] = useState("");
  const [returnLoanIdToConfirm, setReturnLoanIdToConfirm] = useState<string | null>(null);
  const [isFullVoucher, setIsFullVoucher] = useState(true);
  const [selectedDokumenIds, setSelectedDokumenIds] = useState<string[]>([]);

  // Confirmation modal states
  const [isOpenVerifyConfirm, setIsOpenVerifyConfirm] = useState(false);
  const [isOpenUnverifyConfirm, setIsOpenUnverifyConfirm] = useState(false);

  // Helpers
  const isFullyBorrowed = activeLoans.some((l) => l.isFullVoucher);
  const isPartiallyBorrowed = activeLoans.length > 0 && activeLoans.every((l) => !l.isFullVoucher);
  const borrowedDocumentIds = new Set(activeLoans.flatMap((l) => l.dokumenIds));

  const handleVerify = () => {
    if (isPending) return;
    startTransition(async () => {
      const res = await verifyVoucher(voucherId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Nota berhasil diverifikasi!");
        setIsOpenVerifyConfirm(false);
      }
    });
  };

  const handleUnverify = () => {
    if (isPending) return;
    startTransition(async () => {
      const res = await unverifyVoucher(voucherId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Verifikasi nota berhasil dibatalkan.");
        setIsOpenUnverifyConfirm(false);
      }
    });
  };

  const handleBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPeminjam.trim() || !divisiPeminjam) {
      return toast.error("Nama peminjam dan Divisi wajib diisi!");
    }

    if (!isFullVoucher && selectedDokumenIds.length === 0) {
      return toast.error("Pilih minimal satu berkas scan yang ingin dipinjam!");
    }

    startTransition(async () => {
      const res = await borrowVoucher(voucherId, {
        namaPeminjam,
        divisiPeminjam,
        divisiId: selectedDivisionId || undefined,
        keterangan: keperluan,
        isFullVoucher,
        dokumenIds: isFullVoucher ? undefined : selectedDokumenIds,
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Peminjaman berhasil dicatat!");
        setBorrowDialogOpen(false);
        setNamaPeminjam("");
        setDivisiPeminjam("");
        setSelectedDivisionId("");
        setKeperluan("");
        setIsFullVoucher(true);
        setSelectedDokumenIds([]);
      }
    });
  };

  const handleReturnClick = (loanId: string) => {
    startTransition(async () => {
      const res = await returnVoucher(loanId);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Arsip fisik berhasil dikembalikan ke rak!");
        if (activeLoans.length <= 1) {
          setReturnDialogOpen(false);
        }
      }
    });
  };

  const isAdmin = userRole === "ADMIN";

  return (
    <div className="space-y-6">
      {/* 1. STATUS BADGES CARD */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Verification Status Card */}
        <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
          isVerified
            ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100"
            : "bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-100"
        }`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isVerified ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
          }`}>
            {isVerified ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Clock className="h-5 w-5 animate-pulse" />
            )}
          </div>
          <div className="space-y-1 overflow-hidden">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status Pemeriksaan</p>
            <p className="text-sm font-bold">
              {isVerified ? "Sudah Diperiksa (Valid)" : "Menunggu Pemeriksaan Admin"}
            </p>
            {isVerified && verifiedBy && (
              <p className="text-[10px] text-muted-foreground truncate">
                Diverifikasi oleh <span className="font-semibold text-foreground">{verifiedBy.name}</span> pada{" "}
                {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(verifiedAt!))}
              </p>
            )}
          </div>
        </div>

        {/* Physical Loan Status Card */}
        <div className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
          activeLoans.length > 0
            ? isFullyBorrowed
              ? "bg-destructive/5 border-destructive/20 text-destructive"
              : "bg-amber-500/5 border-amber-500/20 text-amber-600"
            : "bg-blue-500/5 border-blue-500/20 text-blue-950 dark:text-blue-100"
        }`}>
          <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
            activeLoans.length > 0 
              ? isFullyBorrowed 
                ? "bg-destructive/10 text-destructive" 
                : "bg-amber-500/10 text-amber-600"
              : "bg-blue-500/10 text-blue-600"
          }`}>
            {activeLoans.length > 0 ? (
              <LogOut className="h-5 w-5" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
          </div>
          <div className="space-y-1 overflow-hidden flex-1">
            <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Status Fisik Dokumen</p>
            <p className="text-sm font-bold">
              {activeLoans.length > 0
                ? isFullyBorrowed
                  ? "Sedang Dipinjam (Penuh)"
                  : `Dipinjam Sebagian (${activeLoans.length} Peminjaman)`
                : "Tersedia di Rak Penyimpanan"}
            </p>
            {activeLoans.length > 0 && (
              <div className="space-y-0.5 mt-1 border-t border-border/20 pt-1">
                {activeLoans.map((l) => (
                  <p key={l.id} className="text-[9px] text-muted-foreground truncate font-medium">
                    • {l.namaPeminjam} ({l.divisiPeminjam})
                    {l.isFullVoucher ? " [1 Map]" : ` [${l.dokumenIds.length} Berkas]`}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. ACTION CONTROLS PANEL */}
      <div className="p-4 bg-secondary/15 border border-border/40 rounded-2xl space-y-3.5">
        <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-primary" />
          Kontrol Sirkulasi & Audit Arsip
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Checker Verify Button */}
          {isAdmin && (
            <>
              {!isVerified ? (
                <Button
                  onClick={() => setIsOpenVerifyConfirm(true)}
                  disabled={isPending}
                  className="rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-600/90 text-white shadow-sm flex items-center gap-1.5 h-9 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  )}
                  Verifikasi Nota
                </Button>
              ) : (
                <Button
                  onClick={() => setIsOpenUnverifyConfirm(true)}
                  disabled={isPending}
                  variant="outline"
                  className="rounded-xl font-semibold text-xs border-destructive/20 hover:border-destructive/40 text-destructive hover:bg-destructive/5 flex items-center gap-1.5 h-9 cursor-pointer"
                >
                  {isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5" />
                  )}
                  Batalkan Verifikasi
                </Button>
              )}
            </>
          )}

          {/* Borrow/Return buttons */}
          {!isFullyBorrowed && (
            <Button
              onClick={() => setBorrowDialogOpen(true)}
              disabled={isPending}
              className="rounded-xl font-semibold text-xs bg-primary hover:bg-primary/95 text-primary-foreground shadow-md shadow-primary/10 flex items-center gap-1.5 h-9 cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              Pinjamkan Nota
            </Button>
          )}

          {activeLoans.length > 0 && (
            <Button
              onClick={() => setReturnDialogOpen(true)}
              disabled={isPending}
              className="rounded-xl font-semibold text-xs bg-blue-600 hover:bg-blue-600/90 text-white shadow-sm flex items-center gap-1.5 h-9 cursor-pointer"
            >
              <LogIn className="h-3.5 w-3.5" />
              Catat Pengembalian
            </Button>
          )}
        </div>
      </div>

      {/* 3. BORROW DIALOG MODAL */}
      <Dialog open={borrowDialogOpen} onOpenChange={setBorrowDialogOpen}>
        <DialogContent className="max-w-[420px] rounded-2xl border-border/50 bg-card/95 backdrop-blur-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Pinjamkan Dokumen</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Catat keluar dokumen Nota ke divisi/unit lain untuk keperluan audit/operasional.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBorrow} className="space-y-4 pt-2">
            {/* Nama Peminjam */}
            <div className="space-y-1.5">
              <Label htmlFor="namaPeminjam" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Nama Peminjam
              </Label>
              <Input
                id="namaPeminjam"
                placeholder="Contoh: Ahmad Subarjo"
                value={namaPeminjam}
                onChange={(e) => setNamaPeminjam(e.target.value)}
                required
                className="bg-background rounded-xl text-xs h-9 px-3"
                disabled={isPending}
              />
            </div>

            {/* Divisi Peminjam */}
            <div className="space-y-1.5">
              <Label htmlFor="divisiPeminjam" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Divisi / Unit Peminjam
              </Label>
              <select
                id="divisiPeminjam"
                value={selectedDivisionId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedDivisionId(val);
                  const matched = divisions.find((d) => d.id === val);
                  setDivisiPeminjam(matched ? matched.namaDivisi : "");
                }}
                className="w-full bg-background border border-border text-foreground px-3 py-2 text-xs rounded-xl outline-none focus:ring-1 focus:ring-primary h-9 cursor-pointer"
                required
                disabled={isPending}
              >
                <option value="">Pilih Divisi / Unit</option>
                {divisions.map((div) => (
                  <option key={div.id} value={div.id}>
                    {div.namaDivisi}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipe Peminjaman */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground/80">Cakupan Berkas</Label>
              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="isFullVoucher"
                    checked={isFullVoucher}
                    onChange={() => setIsFullVoucher(true)}
                    className="h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                    disabled={isPending || activeLoans.length > 0}
                  />
                  Seluruh Map (Penuh)
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                  <input
                    type="radio"
                    name="isFullVoucher"
                    checked={!isFullVoucher}
                    onChange={() => setIsFullVoucher(false)}
                    className="h-4 w-4 text-primary focus:ring-primary cursor-pointer"
                    disabled={isPending}
                  />
                  Sebagian Berkas
                </label>
              </div>
              {activeLoans.length > 0 && (
                <p className="text-[9px] text-amber-500 font-bold leading-none mt-1">
                  * Nota ini sudah dipinjam sebagian, tidak bisa dipinjam secara penuh sekarang.
                </p>
              )}
            </div>

            {/* Document Checkbox List (if partial) */}
            {!isFullVoucher && (
              <div className="space-y-2 border border-border/40 rounded-xl p-3 bg-secondary/15 max-h-[160px] overflow-y-auto">
                <Label className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-wider">
                  Pilih Dokumen Scan Digital yang Dipinjam
                </Label>
                {allDocuments.length > 0 ? (
                  <div className="space-y-2 mt-1">
                    {allDocuments.map((doc) => {
                      const isAlreadyBorrowed = borrowedDocumentIds.has(doc.id);
                      return (
                        <label
                          key={doc.id}
                          className={`flex items-start gap-2.5 text-xs font-semibold ${
                            isAlreadyBorrowed 
                              ? "text-muted-foreground/60 cursor-not-allowed" 
                              : "cursor-pointer text-foreground hover:text-primary transition-colors"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={isAlreadyBorrowed || isPending}
                            checked={selectedDokumenIds.includes(doc.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedDokumenIds((prev) => [...prev, doc.id]);
                              } else {
                                setSelectedDokumenIds((prev) => prev.filter((id) => id !== doc.id));
                              }
                            }}
                            className="h-4 w-4 text-primary rounded border-border focus:ring-primary mt-0.5 cursor-pointer"
                          />
                          <span className="truncate flex-1">
                            {doc.fileName}
                            {isAlreadyBorrowed && (
                              <span className="text-[8px] font-bold text-destructive ml-1.5 bg-destructive/10 px-1 rounded">
                                Sedang Dipinjam
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-2xs text-muted-foreground italic mt-2">
                    Tidak ada berkas digital terlampir pada nota ini.
                  </p>
                )}
              </div>
            )}

            {/* Keperluan */}
            <div className="space-y-1.5">
              <Label htmlFor="keperluan" className="text-xs font-semibold text-foreground/80">
                Keperluan / Keterangan Peminjaman
              </Label>
              <Textarea
                id="keperluan"
                placeholder="Contoh: Audit Pajak Triwulan II"
                value={keperluan}
                onChange={(e) => setKeperluan(e.target.value)}
                className="bg-background rounded-xl text-xs min-h-[70px] py-2 px-3"
                disabled={isPending}
              />
            </div>

            <DialogFooter className="pt-2 gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setBorrowDialogOpen(false)}
                className="rounded-xl font-semibold text-xs h-9 px-4 cursor-pointer"
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="rounded-xl font-semibold text-xs bg-primary hover:bg-primary/95 text-white h-9 px-4 cursor-pointer"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  "Konfirmasi Pinjam"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. RETURN DIALOG MODAL */}
      <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
        <DialogContent className="max-w-[420px] rounded-2xl border-border/50 bg-card/95 backdrop-blur-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Catat Pengembalian Dokumen</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Pilih berkas peminjaman aktif di bawah ini yang telah dikembalikan secara fisik ke dalam map (pembungkus).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 mt-4 max-h-[320px] overflow-y-auto pr-1">
            {activeLoans.map((loan) => {
              const formattedDate = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(loan.tanggalPinjam));
              return (
                <div key={loan.id} className="p-3 bg-secondary/35 border border-border/40 rounded-xl flex flex-col justify-between gap-3 text-2xs text-muted-foreground">
                  <div className="space-y-1">
                    <p>Peminjam: <strong className="text-foreground">{loan.namaPeminjam}</strong> ({loan.divisiPeminjam})</p>
                    <p>Tanggal Pinjam: <span className="text-foreground font-medium">{formattedDate}</span></p>
                    <p>Keperluan: <span className="text-foreground font-medium italic">"{loan.keterangan || "-"}"</span></p>
                    <p>
                      Cakupan:{" "}
                      <span className="font-semibold text-foreground">
                        {loan.isFullVoucher 
                          ? "Seluruh Map (Penuh)" 
                          : `Sebagian Berkas (${loan.dokumenIds.length} File)`}
                      </span>
                    </p>
                  </div>
                  <Button
                    size="xs"
                    onClick={() => setReturnLoanIdToConfirm(loan.id)}
                    disabled={isPending}
                    className="w-full bg-blue-600 hover:bg-blue-600/90 text-white rounded-lg font-bold text-3xs h-7 cursor-pointer"
                  >
                    Catat Sudah Kembali
                  </Button>
                </div>
              );
            })}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReturnDialogOpen(false)}
              className="w-full rounded-xl font-semibold text-xs h-9 cursor-pointer"
              disabled={isPending}
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verify Confirmation Modal */}
      <Dialog open={isOpenVerifyConfirm} onOpenChange={setIsOpenVerifyConfirm}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500">
              <CheckCircle2 className="h-4.5 w-4.5" />
              Verifikasi Nota?
            </DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">
              Apakah Anda yakin ingin memverifikasi arsip bukti pemindahbukuan ini sebagai <span className="font-semibold text-foreground">VALID</span>? Tindakan ini akan menandai bahwa arsip telah diperiksa oleh Admin.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpenVerifyConfirm(false)}
              disabled={isPending}
              className="rounded-xl text-xs h-9 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleVerify}
              disabled={isPending}
              className="rounded-xl text-xs h-9 cursor-pointer bg-emerald-600 hover:bg-emerald-600/90 text-white shadow-sm"
            >
              {isPending ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Verifikasi"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unverify Confirmation Modal */}
      <Dialog open={isOpenUnverifyConfirm} onOpenChange={setIsOpenUnverifyConfirm}>
        <DialogContent className="sm:max-w-[380px] rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-4.5 w-4.5" />
              Batalkan Verifikasi?
            </DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">
              Apakah Anda yakin ingin membatalkan status verifikasi nota ini? Status arsip akan kembali menjadi belum diperiksa.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpenUnverifyConfirm(false)}
              disabled={isPending}
              className="rounded-xl text-xs h-9 cursor-pointer"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleUnverify}
              disabled={isPending}
              className="rounded-xl text-xs h-9 cursor-pointer"
            >
              {isPending ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Memproses...
                </span>
              ) : (
                "Batalkan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Nested Return Loan Confirmation Dialog */}
      <Dialog open={!!returnLoanIdToConfirm} onOpenChange={(open) => !open && setReturnLoanIdToConfirm(null)}>
        <DialogContent className="max-w-[380px] rounded-2xl border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-emerald-600">
              <RotateCcw className="h-4.5 w-4.5" />
              Kembalikan Berkas Nota?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Apakah Anda yakin berkas fisik Nota ini sudah kembali ke dalam map (pembungkus)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setReturnLoanIdToConfirm(null)}
              className="rounded-xl font-semibold text-xs h-9 cursor-pointer"
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (returnLoanIdToConfirm) {
                  handleReturnClick(returnLoanIdToConfirm);
                  setReturnLoanIdToConfirm(null);
                }
              }}
              className="rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-600/90 text-white h-9 cursor-pointer"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Ya, Sudah Kembali
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
