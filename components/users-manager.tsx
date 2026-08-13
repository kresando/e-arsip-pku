"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createUser, deleteUser } from "@/app/actions/user-actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UserPlus, Trash2, Loader2, Calendar, User as UserIcon, Lock } from "lucide-react";

interface UserItem {
  id: string;
  username: string;
  name: string;
  role: string;
  createdAt: string;
}

interface UsersManagerProps {
  users: UserItem[];
}

export default function UsersManager({ users }: UsersManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Create user modal state
  const [isOpenAdd, setIsOpenAdd] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delete confirmation state
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [isOpenDelete, setIsOpenDelete] = useState(false);

  // Handle Add User Submit
  const handleAddSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMsg(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const res = await createUser(null, formData);

      if (res?.error) {
        setErrorMsg(res.error);
        toast.error(res.error);
      } else {
        toast.success("User berhasil ditambahkan!");
        setIsOpenAdd(false);
        router.refresh();
      }
    });
  };

  // Handle Delete Confirmation
  const handleDeleteConfirm = () => {
    if (!userToDelete) return;

    startTransition(async () => {
      const res = await deleteUser(userToDelete.id);

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("User berhasil dihapus!");
        setIsOpenDelete(false);
        setUserToDelete(null);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          Total: <span className="font-semibold text-foreground">{users.length} User</span>
        </div>
        <Button onClick={() => { setErrorMsg(null); setIsOpenAdd(true); }} size="sm" className="rounded-lg shadow-sm">
          <UserPlus className="mr-1.5 h-4 w-4" />
          Tambah User
        </Button>
      </div>

      {/* Users table */}
      <Card className="border border-border/80 shadow-sm bg-card/30 backdrop-blur-md rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Nama Lengkap</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Tanggal Dibuat</TableHead>
                <TableHead className="text-right w-[100px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground text-xs">
                    Belum ada user terdaftar.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((item) => (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium text-xs py-3">{item.name}</TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground py-3">{item.username}</TableCell>
                    <TableCell className="py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-primary/10 text-primary uppercase">
                        {item.role}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground py-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right py-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setUserToDelete(item);
                          setIsOpenDelete(true);
                        }}
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive rounded-lg"
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

      {/* Add User Modal */}
      <Dialog open={isOpenAdd} onOpenChange={setIsOpenAdd}>
        <DialogContent className="sm:max-w-[380px] rounded-xl border-border bg-card">
          <form onSubmit={handleAddSubmit}>
            <DialogHeader>
              <DialogTitle className="text-sm font-bold flex items-center gap-1.5">
                <UserPlus className="h-4.5 w-4.5 text-primary" />
                Tambah User Baru
              </DialogTitle>
              <DialogDescription className="text-2xs text-muted-foreground">
                Daftarkan petugas pengarsipan baru untuk mengelola arsip bukti pemindahbukuan.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {errorMsg && (
                <Alert variant="destructive" className="py-2 px-3 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive">
                  <AlertDescription className="text-2xs font-semibold text-center">
                    {errorMsg}
                  </AlertDescription>
                </Alert>
              )}

              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                  Nama Lengkap
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Nama Lengkap"
                  className="rounded-lg text-xs bg-background/50"
                  required
                  disabled={isPending}
                />
              </div>

              {/* Username */}
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-2xs font-bold text-muted-foreground uppercase tracking-wider">
                  Username
                </Label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/60 pointer-events-none">
                    <UserIcon className="h-3.5 w-3.5" />
                  </span>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="username"
                    className="pl-9 rounded-lg text-xs bg-background/50"
                    required
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
                className="rounded-lg text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="rounded-lg text-xs"
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

      {/* Delete Confirmation Modal */}
      <Dialog open={isOpenDelete} onOpenChange={setIsOpenDelete}>
        <DialogContent className="sm:max-w-[360px] rounded-xl border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <Trash2 className="h-4.5 w-4.5" />
              Hapus User?
            </DialogTitle>
            <DialogDescription className="text-2xs text-muted-foreground">
              Apakah Anda yakin ingin menghapus user <span className="font-semibold text-foreground">{userToDelete?.username}</span>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsOpenDelete(false); setUserToDelete(null); }}
              disabled={isPending}
              className="rounded-lg text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isPending}
              className="rounded-lg text-xs"
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
