"use client";

import React, { useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  UploadCloud,
  Trash2,
  ChevronUp,
  ChevronDown,
  Eye,
  ExternalLink,
  FileText,
  Loader2,
  FileImage,
  EyeOff,
  LogIn,
  LogOut,
  RotateCcw,
  Building,
  User as UserIcon,
  AlertCircle,
} from "lucide-react";
import {
  uploadNotaDocuments,
  deleteNotaDocument,
  reorderNotaDocuments,
  borrowVoucher,
  returnVoucher,
} from "@/app/actions/voucher-actions";

const compressImage = (file: File, maxWidth = 1600, maxHeight = 1600, quality = 0.75): Promise<File> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image/")) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(file);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file);
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile.size < file.size ? compressedFile : file);
          },
          "image/jpeg",
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

interface DocumentItem {
  id: string;
  filePath: string;
  fileName: string;
  order: number;
  createdAt: string | Date;
}

interface NotaDocumentManagerProps {
  notaId: string;
  initialDocuments: DocumentItem[];
  activeLoans?: {
    id: string;
    namaPeminjam: string;
    divisiPeminjam: string;
    isFullVoucher: boolean;
    dokumenIds: string[];
  }[];
  divisions?: { id: string; namaDivisi: string }[];
}

export default function NotaDocumentManager({
  notaId,
  initialDocuments,
  activeLoans = [],
  divisions = [],
}: NotaDocumentManagerProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentItem[]>(initialDocuments);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dragOver, setDragOver] = useState(false);

  // Shortcut borrow states
  const [borrowDocId, setBorrowDocId] = useState<string | null>(null);
  const [namaPeminjam, setNamaPeminjam] = useState("");
  const [divisiPeminjam, setDivisiPeminjam] = useState("");
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [keperluan, setKeperluan] = useState("");

  // Confirmation states
  const [docToDelete, setDocToDelete] = useState<string | null>(null);
  const [docToReturn, setDocToReturn] = useState<string | null>(null);

  const isFullyBorrowed = activeLoans.some((l) => l.isFullVoucher);
  const borrowedDocsMap = new Map<string, string>();
  activeLoans.forEach((loan) => {
    if (loan.isFullVoucher) {
      initialDocuments.forEach((doc) => {
        borrowedDocsMap.set(doc.id, loan.namaPeminjam);
      });
    } else {
      const docIds = loan.dokumenIds || (loan as any).dokumens?.map((d: any) => d.id) || [];
      docIds.forEach((docId: string) => {
        borrowedDocsMap.set(docId, loan.namaPeminjam);
      });
    }
  });

  const handleSingleBorrow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!namaPeminjam.trim() || !divisiPeminjam || !borrowDocId) {
      return toast.error("Nama peminjam dan Divisi wajib diisi!");
    }

    startTransition(async () => {
      const res = await borrowVoucher(notaId, {
        namaPeminjam,
        divisiPeminjam,
        divisiId: selectedDivisionId || undefined,
        keterangan: keperluan,
        isFullVoucher: false,
        dokumenIds: [borrowDocId],
      });

      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Peminjaman berkas berhasil dicatat!");
        setBorrowDocId(null);
        setNamaPeminjam("");
        setDivisiPeminjam("");
        setSelectedDivisionId("");
        setKeperluan("");
        router.refresh();
      }
    });
  };

  const handleSingleReturn = (docId: string) => {
    setDocToReturn(docId);
  };

  const executeSingleReturn = () => {
    if (!docToReturn) return;
    const matchedLoan = activeLoans.find((loan) => {
      if (loan.isFullVoucher) return true;
      const docIds = loan.dokumenIds || (loan as any).dokumens?.map((d: any) => d.id) || [];
      return docIds.includes(docToReturn);
    });

    if (!matchedLoan) {
      setDocToReturn(null);
      return toast.error("Data peminjaman aktif tidak ditemukan untuk berkas ini.");
    }

    startTransition(async () => {
      const res = await returnVoucher(matchedLoan.id);
      if (res?.error) {
        toast.error(res.error);
      } else {
        toast.success("Berkas berhasil dikembalikan!");
        setDocToReturn(null);
        router.refresh();
      }
    });
  };

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isProgrammaticScroll = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleSelectDoc = (id: string) => {
    setActiveDocId(id);
    const el = document.getElementById(`preview-${id}`);
    if (el && scrollContainerRef.current) {
      isProgrammaticScroll.current = true;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      el.scrollIntoView({ behavior: "smooth", block: "start" });

      timeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 800); // Wait for smooth scroll to finish
    }
  };

  // Scroll spy scroll event listener effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || documents.length === 0) return;

    const handleScroll = () => {
      if (isProgrammaticScroll.current) return;

      // 1. Check if scrolled all the way to the bottom (with 15px threshold)
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 15;
      if (isAtBottom) {
        setActiveDocId(documents[documents.length - 1].id);
        return;
      }

      // 2. Normal scrollspy calculation (target line at 25% height of scroll view)
      const targetLine = container.scrollTop + container.clientHeight * 0.25;

      let activeId = documents[0].id;
      for (let i = 0; i < documents.length; i++) {
        const el = document.getElementById(`preview-${documents[i].id}`);
        if (el) {
          const elTop = el.offsetTop - container.offsetTop;
          if (elTop <= targetLine) {
            activeId = documents[i].id;
          } else {
            break;
          }
        }
      }
      setActiveDocId(activeId);
    };

    container.addEventListener("scroll", handleScroll);
    
    // Initial call to sync layout
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [documents]);

  // Sync documents state if initialDocuments changes
  useEffect(() => {
    // Sort initial documents by order
    const sorted = [...initialDocuments].sort((a, b) => a.order - b.order);
    setDocuments(sorted);

    // Auto-select first document if nothing is active or active is no longer present
    if (sorted.length > 0) {
      if (!activeDocId || !sorted.some((d) => d.id === activeDocId)) {
        setActiveDocId(sorted[0].id);
      }
    } else {
      setActiveDocId(null);
    }
  }, [initialDocuments]);

  const activeDoc = documents.find((d) => d.id === activeDocId) || null;

  // Handle file select/upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(files);
  };

  const uploadFiles = async (fileList: FileList) => {
    const toastId = toast.loading("Memproses dan mengompresi berkas...");
    
    try {
      const formData = new FormData();
      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type.startsWith("image/")) {
          const compressed = await compressImage(file);
          formData.append("files", compressed);
        } else {
          formData.append("files", file);
        }
      }
      
      toast.dismiss(toastId);
      
      startTransition(async () => {
        const res = await uploadNotaDocuments(notaId, formData);
        if (res.error) {
          toast.error(res.error);
        } else {
          toast.success(`Berhasil mengunggah ${res.count} berkas digital.`);
        }
      });
    } catch (err) {
      toast.dismiss(toastId);
      console.error("Compression/Upload error:", err);
      toast.error("Gagal memproses berkas digital.");
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadFiles(files);
    }
  };

  // Delete document
  const handleDelete = (docId: string) => {
    setDocToDelete(docId);
  };

  const executeDelete = () => {
    if (!docToDelete) return;

    startTransition(async () => {
      const res = await deleteNotaDocument(docToDelete);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Berkas digital berhasil dihapus.");
        setDocuments((prev) => {
          const updated = prev.filter((d) => d.id !== docToDelete);
          if (activeDocId === docToDelete) {
            setActiveDocId(updated.length > 0 ? updated[0].id : null);
          }
          return updated;
        });
        setDocToDelete(null);
      }
    });
  };

  // Move document order (up or down)
  const handleMove = async (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === documents.length - 1) return;

    const targetIndex = direction === "up" ? index - 1 : index + 1;
    const updatedDocs = [...documents];

    // Swap elements
    const temp = updatedDocs[index];
    updatedDocs[index] = updatedDocs[targetIndex];
    updatedDocs[targetIndex] = temp;

    // Apply new sequential order locally
    const reordered = updatedDocs.map((doc, idx) => ({
      ...doc,
      order: idx,
    }));

    setDocuments(reordered);

    startTransition(async () => {
      const docIds = reordered.map((d) => d.id);
      const res = await reorderNotaDocuments(notaId, docIds);
      if (res.error) {
        toast.error(res.error);
        // Revert to initial sorting on error
        setDocuments([...initialDocuments].sort((a, b) => a.order - b.order));
      }
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-12 items-stretch min-h-[500px]">
      {/* Left Column: List & Actions */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <Card className="border-border/40 rounded-2xl bg-card shadow-sm flex flex-col flex-1">
          <CardHeader className="pb-3 border-b border-border/30 flex-shrink-0">
            <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5 whitespace-nowrap">
              <span>Daftar Berkas</span>
              <span className="bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded-full font-bold">
                {documents.length} File
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1 flex flex-col justify-between min-h-[300px]">
            {/* List */}
            <div className="space-y-2 overflow-y-auto max-h-[350px] pr-1.5 flex-1 mb-4">
              {documents.length > 0 ? (
                documents.map((doc, index) => {
                  const isActive = doc.id === activeDocId;
                  const isPdf = doc.filePath.toLowerCase().endsWith(".pdf");

                  return (
                    <div
                      key={doc.id}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all text-xs ${
                        isActive
                          ? "bg-primary/10 border-primary/30 text-foreground"
                          : "bg-secondary/10 border-border/30 text-muted-foreground hover:bg-secondary/20 hover:border-border/60"
                      }`}
                    >
                      <button
                        onClick={() => handleSelectDoc(doc.id)}
                        className="flex items-center gap-2 overflow-hidden flex-1 text-left font-semibold text-foreground truncate cursor-pointer mr-2"
                      >
                        {isPdf ? (
                          <FileText className="h-4.5 w-4.5 text-red-500 flex-shrink-0" />
                        ) : (
                          <FileImage className="h-4.5 w-4.5 text-blue-500 flex-shrink-0" />
                        )}
                        <span className="truncate flex-1">{doc.fileName}</span>
                        {borrowedDocsMap.has(doc.id) && (
                          <span
                            className="text-[8px] font-extrabold bg-destructive/10 text-destructive border border-destructive/20 px-1 py-0.5 rounded flex-shrink-0 animate-pulse"
                            title={`Dipinjam oleh: ${borrowedDocsMap.get(doc.id)}`}
                          >
                            Dipinjam
                          </span>
                        )}
                      </button>

                      {/* Controls (arrows + trash) */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md hover:bg-background"
                          disabled={index === 0 || isPending}
                          onClick={() => handleMove(index, "up")}
                          title="Pindahkan ke atas"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md hover:bg-background"
                          disabled={index === documents.length - 1 || isPending}
                          onClick={() => handleMove(index, "down")}
                          title="Pindahkan ke bawah"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </Button>

                        {/* Borrow/Return shortcut */}
                        {borrowedDocsMap.has(doc.id) ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-background text-emerald-600 hover:text-emerald-700"
                            disabled={isPending}
                            onClick={() => handleSingleReturn(doc.id)}
                            title={`Kembalikan berkas ini (Dipinjam oleh: ${borrowedDocsMap.get(doc.id)})`}
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 rounded-md hover:bg-background text-primary hover:text-primary"
                            disabled={isPending || isFullyBorrowed}
                            onClick={() => setBorrowDocId(doc.id)}
                            title="Pinjamkan berkas ini"
                          >
                            <LogOut className="h-3.5 w-3.5" />
                          </Button>
                        )}

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 rounded-md text-destructive hover:bg-destructive/15 hover:text-destructive"
                          disabled={isPending}
                          onClick={() => handleDelete(doc.id)}
                          title="Hapus berkas"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground text-2xs italic gap-1.5 border border-dashed border-border rounded-xl">
                  <EyeOff className="h-6 w-6 text-muted-foreground/30" />
                  Belum ada berkas digital diunggah
                </div>
              )}
            </div>

            {/* Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-primary bg-primary/5"
                  : "border-border/60 hover:border-primary/50 bg-secondary/5 hover:bg-secondary/15"
              }`}
            >
              {isPending ? (
                <div className="py-4 flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-[10px] font-bold text-primary animate-pulse">Mengunggah Berkas...</p>
                </div>
              ) : (
                <label className="w-full flex flex-col items-center cursor-pointer">
                  <UploadCloud className="h-6 w-6 text-muted-foreground/80 hover:text-primary transition-colors" />
                  <span className="text-[10px] font-bold text-foreground mt-1">Unggah Dokumen Baru</span>
                  <span className="text-[9px] text-muted-foreground">Seret & taruh atau klik di sini</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column: Display Preview (Scrollable Stacked Documents) */}
      <div className="lg:col-span-8">
        <Card className="border-border/40 rounded-2xl bg-card shadow-sm h-full flex flex-col overflow-hidden max-h-[700px]">
          <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between flex-shrink-0">
            <div /> {/* Text preview dihapus */}
            {activeDoc && (
              <Button
                asChild
                variant="outline"
                size="xs"
                className="rounded-lg text-2xs font-semibold cursor-pointer"
              >
                <a
                  href={activeDoc.filePath}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1"
                >
                  Buka Penuh ({activeDoc.fileName.length > 15 ? activeDoc.fileName.slice(0, 15) + "..." : activeDoc.fileName})
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
          </CardHeader>
          <CardContent 
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto p-4 bg-secondary/5 space-y-6 scroll-smooth"
            id="preview-scroll-container"
          >
            {documents.length > 0 ? (
              documents.map((doc) => {
                const isPdf = doc.filePath.toLowerCase().endsWith(".pdf");
                return (
                  <div 
                    key={doc.id} 
                    id={`preview-${doc.id}`}
                    className={`border border-border/40 rounded-2xl overflow-hidden bg-card shadow-sm transition-all duration-300 ${
                      doc.id === activeDocId ? "ring-2 ring-primary/20 border-primary/40 shadow-md scale-[1.01]" : ""
                    }`}
                  >
                    <div className="bg-secondary/40 border-b border-border/20 px-4 py-2 flex items-center justify-between text-2xs font-semibold text-muted-foreground">
                      <span className="truncate font-bold text-foreground">
                        {doc.order + 1}. {doc.fileName}
                      </span>
                      <Button asChild variant="ghost" size="icon" className="h-5 w-5 rounded-md hover:bg-background">
                        <a href={doc.filePath} target="_blank" rel="noopener noreferrer" title="Buka Tab Baru">
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                    <div className="min-h-[400px] flex items-stretch">
                      {isPdf ? (
                        <iframe
                          src={`${doc.filePath}#toolbar=0`}
                          className="w-full min-h-[500px] border-0"
                          title={`PDF Preview ${doc.fileName}`}
                        />
                      ) : (
                        <div className="flex-1 flex items-center justify-center p-4 bg-secondary/10">
                          <img
                            src={doc.filePath}
                            alt={doc.fileName}
                            className="max-w-full max-h-[480px] object-contain rounded-lg shadow-sm border border-border/30"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center text-xs text-muted-foreground gap-3">
                <EyeOff className="h-10 w-10 text-muted-foreground/30" />
                <p className="font-semibold text-foreground/80">Tidak ada dokumen</p>
                <p className="text-2xs text-muted-foreground max-w-[280px]">
                  Unggah berkas digital baru menggunakan form di sebelah kiri untuk melampirkan salinan nota.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Shortcut Borrow Dialog */}
      <Dialog open={!!borrowDocId} onOpenChange={(open) => !open && setBorrowDocId(null)}>
        <DialogContent className="max-w-[420px] rounded-2xl border-border/50 bg-card/95 backdrop-blur-md p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Pinjamkan Berkas</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Catat peminjaman berkas: <strong className="text-foreground">{documents.find(d => d.id === borrowDocId)?.fileName}</strong>
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSingleBorrow} className="space-y-4 pt-2">
            {/* Nama Peminjam */}
            <div className="space-y-1.5">
              <Label htmlFor="shortcut-namaPeminjam" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
                Nama Peminjam
              </Label>
              <Input
                id="shortcut-namaPeminjam"
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
              <Label htmlFor="shortcut-divisiPeminjam" className="text-xs font-semibold text-foreground/80 flex items-center gap-1">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Divisi / Unit Peminjam
              </Label>
              <select
                id="shortcut-divisiPeminjam"
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

            {/* Keperluan */}
            <div className="space-y-1.5">
              <Label htmlFor="shortcut-keperluan" className="text-xs font-semibold text-foreground/80">
                Keperluan / Keterangan Peminjaman
              </Label>
              <Textarea
                id="shortcut-keperluan"
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
                onClick={() => setBorrowDocId(null)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!docToDelete} onOpenChange={(open) => !open && setDocToDelete(null)}>
        <DialogContent className="max-w-[380px] rounded-2xl border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-destructive">
              <AlertCircle className="h-4.5 w-4.5" />
              Hapus Berkas Digital?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Apakah Anda yakin ingin menghapus berkas digital <strong className="text-foreground">"{documents.find(d => d.id === docToDelete)?.fileName}"</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDocToDelete(null)}
              className="rounded-xl font-semibold text-xs h-9 cursor-pointer"
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              onClick={executeDelete}
              className="rounded-xl font-semibold text-xs bg-destructive hover:bg-destructive/90 text-white h-9 cursor-pointer animate-in fade-in"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Confirmation Dialog */}
      <Dialog open={!!docToReturn} onOpenChange={(open) => !open && setDocToReturn(null)}>
        <DialogContent className="max-w-[380px] rounded-2xl border-border bg-card p-6">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold flex items-center gap-1.5 text-emerald-600">
              <RotateCcw className="h-4.5 w-4.5" />
              Kembalikan Berkas?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5">
              Apakah Anda yakin berkas digital <strong className="text-foreground">"{documents.find(d => d.id === docToReturn)?.fileName}"</strong> telah dimasukkan kembali secara fisik ke dalam map (pembungkus)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDocToReturn(null)}
              className="rounded-xl font-semibold text-xs h-9 cursor-pointer"
              disabled={isPending}
            >
              Batal
            </Button>
            <Button
              onClick={executeSingleReturn}
              className="rounded-xl font-semibold text-xs bg-emerald-600 hover:bg-emerald-600/90 text-white h-9 cursor-pointer"
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
              Ya, Sudah Kembali
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
