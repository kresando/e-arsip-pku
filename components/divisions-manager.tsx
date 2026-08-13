"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createDivision, updateDivision, deleteDivision } from "@/app/actions/division-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Edit2, Loader2, Calendar, Building, FileText } from "lucide-react";

interface DivisionItem {
  id: string;
  namaDivisi: string;
  keterangan: string | null;
  createdAt: string;
}

interface DivisionsManagerProps {
  divisions: DivisionItem[];
}

export default function DivisionsManager({ divisions }: DivisionsManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [isOpenEdit, setIsOpenEdit] = useState(false);
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  // Form error message
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Active items for Edit/Delete
  const [activeDivision, setActiveDivision] = useState<DivisionItem | null>(null);

  // Edit form states
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  // Handle Add Division Submit
  const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await createDivision(null, formData);

      if (res?.error) {
        setErrorMsg(res.error);
        toast.error(res.error);
      } else {
        toast.success("Divisi berhasil ditambahkan!");
        setIsOpenAdd(false);
        router.refresh();
      }
    });
  };

  // Handle Edit Division Submit
  const handleEditSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeDivision) return;
    setErrorMsg(null);

    startTransition(async () => {
      const res = await updateDivision(activeDivision.id, {
        namaDivisi: editName,
        keterangan: editDesc,
      });

      if (res?.error) {
        setErrorMsg(res.error);
        toast.error(res.error);
      } else {
        toast.success("Divisi berhasil diperbarui!");
        setIsOpenEdit(false);
        setActiveDivision(null);
        router.refresh();
      }
    });
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!activeDivision) return;

    startTransition(async () => {
      const res = await deleteDivision(activeDivision.id);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Divisi berhasil dihapus!");
        setIsOpenDelete(false);
        setActiveDivision(null);
        router.refresh();
      }
    });
  };

  const openEditModal = (item: DivisionItem) => {
    setActiveDivision(item);
    setEditName(item.namaDivisi);
    setEditDesc(item.keterangan || "");
    setErrorMsg(null);
    setIsOpenEdit(true);
  };

  const openDeleteModal = (item: DivisionItem) => {
    setActiveDivision(item);
    setIsOpenDelete(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{divisions.length} Divisi</span>
        </div>
        <Button onClick={() => { setErrorMsg(null); setIsOpenAdd(true); }} size="sm" className="rounded-xl shadow-sm cursor-pointer">
          <Plus className="mr-1.5 h-4 w-4" />
          Tambah Divisi
        </Button>
      </div>

      {/* Divisions Table */}
      <Card className="border border-border/80 shadow-sm bg-card/30 backdrop-blur-md rounded-2xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[240px]">Nama Divisi</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead className="w-[180px]">Tanggal Dibuat</TableHead>
                <TableHead className="text-right w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-xs">
                    Belum ada divisi terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                divisions.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-semibold text-xs py-3.5">
                      <span className="flex items-center gap-2">
                        <Building className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.namaDivisi}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-3.5 max-w-[300px] truncate">
                      {item.keterangan || "-"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-3.5">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-3.5 space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-xl cursor-pointer"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteModal(item)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Division Modal */}
      <Dialog open={isOpenAdd} onOpenChange={setIsOpenAdd}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-border bg-card">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
                <Plus className="h-4.5 w-4.5 text-primary" />
                Tambah Divisi Baru
              </DialogTitle>
              <DialogDescription className="text-2xs text-muted-foreground">
                Tambahkan unit atau divisi baru untuk keperluan sirkulasi peminjaman nota.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {errorMsg && (
                <Alert variant="destructive" className="py-2 px-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
                  <AlertDescription className="text-2xs font-semibold text-center">
                    {errorMsg}
                  </AlertDescription>
                </Alert>
              )}

              {/* Division Name */}
              <div className="space-y-1.5">
                <Label htmlFor="namaDivisi" className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                  Nama Divisi / Unit
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60 pointer-events-none">
                    <Building className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    id="namaDivisi"
                    name="namaDivisi"
                    type="text"
                    placeholder="Contoh: Teknologi Informasi"
                    className="pl-9 rounded-xl text-xs bg-background/50 h-9"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="keterangan" className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                  Keterangan (Opsional)
                </Label>
                <div className="relative">
                  <Textarea
                    id="keterangan"
                    name="keterangan"
                    placeholder="Deskripsi singkat mengenai divisi ini..."
                    className="rounded-xl text-xs bg-background/50 min-h-[80px]"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsOpenAdd(false)}
                disabled={isPending}
                className="rounded-xl text-xs h-9 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl text-xs h-9 cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Division Modal */}
      <Dialog open={isOpenEdit} onOpenChange={setIsOpenEdit}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl border-border bg-card">
          <form onSubmit={handleEditSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
                <Edit2 className="h-4.5 w-4.5 text-primary" />
                Ubah Divisi
              </DialogTitle>
              <DialogDescription className="text-2xs text-muted-foreground">
                Perbarui detail informasi divisi terpilih.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {errorMsg && (
                <Alert variant="destructive" className="py-2 px-3 rounded-xl border border-destructive/20 bg-destructive/5 text-destructive">
                  <AlertDescription className="text-2xs font-semibold text-center">
                    {errorMsg}
                  </AlertDescription>
                </Alert>
              )}

              {/* Division Name */}
              <div className="space-y-1.5">
                <Label htmlFor="editNamaDivisi" className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                  Nama Divisi / Unit
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60 pointer-events-none">
                    <Building className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    id="editNamaDivisi"
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Contoh: Teknologi Informasi"
                    className="pl-9 rounded-xl text-xs bg-background/50 h-9"
                    required
                    disabled={isPending}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="editKeterangan" className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                  Keterangan (Opsional)
                </Label>
                <div className="relative">
                  <Textarea
                    id="editKeterangan"
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    placeholder="Deskripsi singkat mengenai divisi ini..."
                    className="rounded-xl text-xs bg-background/50 min-h-[80px]"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => { setIsOpenEdit(false); setActiveDivision(null); }}
                disabled={isPending}
                className="rounded-xl text-xs h-9 cursor-pointer"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-xl text-xs h-9 cursor-pointer"
              >
                {isPending ? (
                  <span className="flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Menyimpan...
                  </span>
                ) : (
                  "Simpan Perubahan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isOpenDelete} onOpenChange={setIsOpenDelete}>
        <DialogContent className="sm:max-w-[360px] rounded-2xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              Hapus Divisi?
            </DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">
              Apakah Anda yakin ingin menghapus divisi <span className="font-semibold text-foreground">{activeDivision?.namaDivisi}</span>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsOpenDelete(false); setActiveDivision(null); }}
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
