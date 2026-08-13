"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { uploadFileToStorage, deleteFileFromStorage } from "@/lib/storage";

// Helper to translate day of week to Indonesian name
function getIndonesianDayName(date: Date): string {
  const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[date.getDay()];
}

export async function getVouchers(filters?: {
  search?: string;
  rakId?: string;
  dusId?: string;
  pembungkusId?: string;
  tahun?: string;
  bulan?: string;
  isVerified?: string;       // "all", "true", "false"
  statusKeberadaan?: string; // "all", "tersedia", "dipinjam"
}) {
  try {
    const whereClause: any = {};

    if (filters?.search) {
      whereClause.OR = [
        { nomorBukti: { contains: filters.search, mode: "insensitive" } },
        { keterangan: { contains: filters.search, mode: "insensitive" } },
        {
          pembungkus: {
            namaPembungkus: { contains: filters.search, mode: "insensitive" },
          },
        },
        {
          pembungkus: {
            dus: {
              namaDus: { contains: filters.search, mode: "insensitive" },
            },
          },
        },
        {
          pembungkus: {
            dus: {
              rak: {
                namaRak: { contains: filters.search, mode: "insensitive" },
              },
            },
          },
        },
      ];
    }

    if (filters?.pembungkusId) {
      whereClause.pembungkusId = filters.pembungkusId;
    } else if (filters?.dusId) {
      whereClause.pembungkus = { dusId: filters.dusId };
    } else if (filters?.rakId) {
      whereClause.pembungkus = {
        dus: { rakId: filters.rakId },
      };
    }

    if (filters?.tahun) {
      whereClause.tahun = parseInt(filters.tahun);
    }

    if (filters?.bulan) {
      whereClause.bulan = parseInt(filters.bulan);
    }

    // Checker filters
    if (filters?.isVerified === "true") {
      whereClause.isVerified = true;
    } else if (filters?.isVerified === "false") {
      whereClause.isVerified = false;
    }

    // Circulation/Borrowing filters
    if (filters?.statusKeberadaan === "dipinjam") {
      whereClause.peminjamans = {
        some: {
          status: "DIPINJAM",
        },
      };
    } else if (filters?.statusKeberadaan === "tersedia") {
      whereClause.NOT = {
        peminjamans: {
          some: {
            status: "DIPINJAM",
          },
        },
      };
    }

    return await prisma.nota.findMany({
      where: whereClause,
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
          orderBy: { createdAt: "desc" },
        },
        dokumens: true,
      },
      orderBy: { tanggalBukti: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch vouchers:", error);
    return [];
  }
}

export async function createVoucher(prevState: any, formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };

    const nomorBukti = formData.get("nomorBukti") as string;
    const tanggalBuktiStr = formData.get("tanggalBukti") as string; // yyyy-mm-dd
    const keterangan = formData.get("keterangan") as string;
    const pembungkusId = formData.get("pembungkusId") as string;
    const userId = formData.get("userId") as string;

    if (!nomorBukti || !tanggalBuktiStr || !pembungkusId || !userId) {
      return { error: "Semua field wajib diisi (kecuali keterangan)" };
    }

    // Check uniqueness
    const existing = await prisma.nota.findUnique({
      where: { nomorBukti: nomorBukti.trim() },
    });
    if (existing) return { error: `Nota dengan nomor "${nomorBukti}" sudah terdaftar.` };

    // Parse date details
    const tanggalBukti = new Date(tanggalBuktiStr);
    if (isNaN(tanggalBukti.getTime())) {
      return { error: "Format tanggal tidak valid." };
    }
    const hari = getIndonesianDayName(tanggalBukti);
    const tanggal = tanggalBukti.getDate();
    const bulan = tanggalBukti.getMonth() + 1; // 1-indexed
    const tahun = tanggalBukti.getFullYear();

    const newVoucher = await prisma.nota.create({
      data: {
        nomorBukti: nomorBukti.trim(),
        tanggalBukti,
        hari,
        tanggal,
        bulan,
        tahun,
        keterangan: keterangan || null,
        pembungkusId,
        userId,
      },
    });

    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true, data: JSON.parse(JSON.stringify(newVoucher)) };
  } catch (error) {
    console.error("Failed to create voucher:", error);
    return { error: "Terjadi kesalahan sistem saat menyimpan arsip nota." };
  }
}

export async function updateVoucher(id: string, prevState: any, formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };

    const nomorBukti = formData.get("nomorBukti") as string;
    const tanggalBuktiStr = formData.get("tanggalBukti") as string;
    const keterangan = formData.get("keterangan") as string;
    const pembungkusId = formData.get("pembungkusId") as string;
    const userId = formData.get("userId") as string;

    if (!nomorBukti || !tanggalBuktiStr || !pembungkusId || !userId) {
      return { error: "Semua field wajib diisi." };
    }

    const currentVoucher = await prisma.nota.findUnique({ where: { id } });
    if (!currentVoucher) return { error: "Nota tidak ditemukan." };

    // Check unique nomorBukti
    const existing = await prisma.nota.findFirst({
      where: {
        nomorBukti: nomorBukti.trim(),
        id: { not: id },
      },
    });
    if (existing) return { error: `Nomor bukti "${nomorBukti}" sudah terdaftar pada item lain.` };

    // Parse date details
    const tanggalBukti = new Date(tanggalBuktiStr);
    const hari = getIndonesianDayName(tanggalBukti);
    const tanggal = tanggalBukti.getDate();
    const bulan = tanggalBukti.getMonth() + 1;
    const tahun = tanggalBukti.getFullYear();

    const updated = await prisma.nota.update({
      where: { id },
      data: {
        nomorBukti: nomorBukti.trim(),
        tanggalBukti,
        hari,
        tanggal,
        bulan,
        tahun,
        keterangan: keterangan || null,
        pembungkusId,
        userId,
      },
    });

    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error) {
    console.error("Failed to update voucher:", error);
    return { error: "Terjadi kesalahan sistem saat memperbarui arsip nota." };
  }
}

export async function deleteVoucher(id: string) {
  try {
    const current = await prisma.nota.findUnique({
      where: { id },
      include: { dokumens: true },
    });
    if (!current) return { error: "Nota tidak ditemukan." };

    if (current.dokumens && current.dokumens.length > 0) {
      for (const doc of current.dokumens) {
        await deleteFileFromStorage(doc.filePath);
      }
    }

    await prisma.nota.delete({ where: { id } });

    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete voucher:", error);
    return { error: "Terjadi kesalahan sistem saat menghapus arsip nota." };
  }
}

// Get aggregate stats for Dashboard page
export async function getDashboardStats() {
  try {
    const totalVouchers = await prisma.nota.count();
    const totalRak = await prisma.rak.count();
    const totalDus = await prisma.dus.count();
    const totalPembungkus = await prisma.pembungkus.count();

    // Checker & Borrowing stats
    const totalUnverified = await prisma.nota.count({ where: { isVerified: false } });
    const totalVerified = await prisma.nota.count({ where: { isVerified: true } });
    const totalBorrowed = await prisma.nota.count({
      where: {
        peminjamans: {
          some: { status: "DIPINJAM" },
        },
      },
    });
    const totalAvailable = await prisma.nota.count({
      where: {
        NOT: {
          peminjamans: {
            some: { status: "DIPINJAM" },
          },
        },
      },
    });



    // Vouchers by year
    const vouchersByYear = await prisma.nota.groupBy({
      by: ["tahun"],
      _count: {
        id: true,
      },
      orderBy: {
        tahun: "asc",
      },
    });

    // Recent activity list
    const recentVouchers = await prisma.nota.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
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
        user: { select: { name: true } },
      },
    });

    return {
      totalVouchers,
      totalRak,
      totalDus,
      totalPembungkus,
      totalUnverified,
      totalVerified,
      totalBorrowed,
      totalAvailable,
      vouchersByYear: vouchersByYear.map((item: any) => ({
        tahun: item.tahun,
        count: item._count.id,
      })),
      recentVouchers,
    };
  } catch (error) {
    console.error("Failed to fetch dashboard stats:", error);
    return {
      totalVouchers: 0,
      totalRak: 0,
      totalDus: 0,
      totalPembungkus: 0,
      totalUnverified: 0,
      totalVerified: 0,
      totalBorrowed: 0,
      totalAvailable: 0,
      vouchersByYear: [],
      recentVouchers: [],
    };
  }
}

export async function verifyVoucher(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };
    
    // Verify user exists in database to prevent constraint violations with stale cookies
    const dbUser = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!dbUser) return { error: "Akun Anda tidak ditemukan di database. Silakan Logout dan Login kembali." };

    if (currentUser.role !== "ADMIN") {
      return { error: "Hanya Admin yang diperbolehkan memverifikasi nota." };
    }

    const updated = await prisma.nota.update({
      where: { id },
      data: {
        isVerified: true,
        verifiedById: currentUser.id,
        verifiedAt: new Date(),
      },
    });

    revalidatePath(`/dashboard/vouchers/${id}`);
    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error) {
    console.error("Failed to verify voucher:", error);
    return { error: "Terjadi kesalahan sistem saat memverifikasi nota." };
  }
}

export async function unverifyVoucher(id: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };
    
    // Verify user exists in database to prevent constraint violations with stale cookies
    const dbUser = await prisma.user.findUnique({ where: { id: currentUser.id } });
    if (!dbUser) return { error: "Akun Anda tidak ditemukan di database. Silakan Logout dan Login kembali." };

    if (currentUser.role !== "ADMIN") {
      return { error: "Hanya Admin yang diperbolehkan membatalkan verifikasi." };
    }

    const updated = await prisma.nota.update({
      where: { id },
      data: {
        isVerified: false,
        verifiedById: null,
        verifiedAt: null,
      },
    });

    revalidatePath(`/dashboard/vouchers/${id}`);
    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error) {
    console.error("Failed to unverify voucher:", error);
    return { error: "Terjadi kesalahan sistem saat membatalkan verifikasi." };
  }
}

export async function borrowVoucher(
  notaId: string,
  data: {
    namaPeminjam: string;
    divisiPeminjam: string;
    divisiId?: string;
    keterangan?: string;
    isFullVoucher: boolean;
    dokumenIds?: string[];
  }
) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };

    // 1. Check if the entire voucher is currently borrowed
    const activeFullLoan = await prisma.peminjaman.findFirst({
      where: {
        notaId,
        status: "DIPINJAM",
        isFullVoucher: true,
      },
    });

    if (activeFullLoan) {
      return { error: "Nota ini sedang dipinjam secara penuh." };
    }

    // 2. Validate based on borrow type
    if (data.isFullVoucher) {
      // If we want to borrow FULL, check if there are any active partial loans
      const activePartialLoan = await prisma.peminjaman.findFirst({
        where: {
          notaId,
          status: "DIPINJAM",
          isFullVoucher: false,
        },
      });

      if (activePartialLoan) {
        return {
          error: "Beberapa dokumen dari nota ini sedang dipinjam secara terpisah. Harap catat pengembalian seluruh berkas tersebut dahulu sebelum meminjam secara penuh.",
        };
      }
    } else {
      // If we want to borrow PARTIAL, check if we provided any documents
      if (!data.dokumenIds || data.dokumenIds.length === 0) {
        return { error: "Harap pilih minimal satu berkas dokumen untuk dipinjam." };
      }

      // Check if any of the selected documents are currently in active loans
      const alreadyBorrowedDocs = await prisma.notaDokumen.findMany({
        where: {
          id: { in: data.dokumenIds },
          peminjamans: {
            some: {
              status: "DIPINJAM",
            },
          },
        },
        select: { fileName: true },
      });

      if (alreadyBorrowedDocs.length > 0) {
        const docNames = alreadyBorrowedDocs.map((d: { fileName: string }) => d.fileName).join(", ");
        return { error: `Berkas berikut sedang dipinjam oleh pihak lain: ${docNames}` };
      }
    }

    // 3. Create the loan record
    const newLoan = await prisma.peminjaman.create({
      data: {
        notaId,
        namaPeminjam: data.namaPeminjam.trim(),
        divisiPeminjam: data.divisiPeminjam.trim(),
        divisiId: data.divisiId || null,
        keterangan: data.keterangan?.trim() || null,
        status: "DIPINJAM",
        isFullVoucher: data.isFullVoucher,
        dokumens: data.isFullVoucher
          ? undefined
          : {
              connect: data.dokumenIds?.map((id: string) => ({ id })),
            },
      },
    });


    revalidatePath(`/dashboard/vouchers/${notaId}`);
    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true, data: JSON.parse(JSON.stringify(newLoan)) };
  } catch (error) {
    console.error("Failed to borrow voucher:", error);
    return { error: "Terjadi kesalahan sistem saat memproses peminjaman nota." };
  }
}

export async function returnVoucher(peminjamanId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };

    // Find the active loan
    const activeLoan = await prisma.peminjaman.findUnique({
      where: {
        id: peminjamanId,
      },
    });

    if (!activeLoan || activeLoan.status !== "DIPINJAM") {
      return { error: "Data peminjaman tidak aktif atau tidak ditemukan." };
    }

    const updatedLoan = await prisma.peminjaman.update({
      where: { id: peminjamanId },
      data: {
        tanggalKembali: new Date(),
        status: "DIKEMBALIKAN",
      },
    });

    revalidatePath(`/dashboard/vouchers/${activeLoan.notaId}`);
    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true, data: JSON.parse(JSON.stringify(updatedLoan)) };
  } catch (error) {
    console.error("Failed to return voucher:", error);
    return { error: "Terjadi kesalahan sistem saat memproses pengembalian nota." };
  }
}

export async function createVouchersBulk(formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };

    const vouchersJSON = formData.get("vouchers") as string;
    if (!vouchersJSON) return { error: "Data nota tidak ditemukan." };

    const rawVouchers = JSON.parse(vouchersJSON);
    if (!Array.isArray(rawVouchers) || rawVouchers.length === 0) {
      return { error: "Minimal harus menginput satu nota." };
    }

    // First validate all basic fields
    for (let i = 0; i < rawVouchers.length; i++) {
      const v = rawVouchers[i];
      if (!v.nomorBukti || !v.nomorBukti.trim()) {
        return { error: `Baris ke-${i + 1}: Nomor Bukti wajib diisi.` };
      }
      if (!v.tanggalBukti) {
        return { error: `Baris ke-${i + 1} (${v.nomorBukti}): Tanggal Bukti wajib diisi.` };
      }

      if (!v.pembungkusId) {
        return { error: `Baris ke-${i + 1} (${v.nomorBukti}): Map (Pembungkus) wajib dipilih.` };
      }
    }

    // Check duplicate nomorBukti in the batch
    const numList = rawVouchers.map(v => v.nomorBukti.trim());
    const duplicates = numList.filter((item, index) => numList.indexOf(item) !== index);
    if (duplicates.length > 0) {
      return { error: `Nomor bukti tidak boleh duplikat di dalam batch: "${duplicates[0]}".` };
    }

    // Check duplicates in database
    const existing = await prisma.nota.findMany({
      where: { nomorBukti: { in: numList } },
      select: { nomorBukti: true }
    });
    if (existing.length > 0) {
      return { error: `Nota dengan nomor "${existing[0].nomorBukti}" sudah terdaftar di database.` };
    }



    const results = await prisma.$transaction(async (tx: any) => {
      const creations = [];

      for (let i = 0; i < rawVouchers.length; i++) {
        const v = rawVouchers[i];
        const tanggalBukti = new Date(v.tanggalBukti);
        if (isNaN(tanggalBukti.getTime())) {
          throw new Error(`Format tanggal pada baris ke-${i + 1} tidak valid.`);
        }

        const hari = getIndonesianDayName(tanggalBukti);
        const tanggal = tanggalBukti.getDate();
        const bulan = tanggalBukti.getMonth() + 1;
        const tahun = tanggalBukti.getFullYear();

        const newV = await tx.nota.create({
          data: {
            nomorBukti: v.nomorBukti.trim(),
            tanggalBukti,
            hari,
            tanggal,
            bulan,
            tahun,
            keterangan: v.keterangan || null,
            pembungkusId: v.pembungkusId,
            userId: v.userId || currentUser.id,
          }
        });
        creations.push(newV);
      }
      return creations;
    });

    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true, count: results.length };
  } catch (error: any) {
    console.error("Failed to batch create vouchers:", error);
    return { error: error.message || "Terjadi kesalahan sistem saat menyimpan arsip nota bulk." };
  }
}

export async function getLatestVoucherNumberForUser(userId: string): Promise<string | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!user) return null;

    // Extract digits prefix from username (e.g., k0110 -> 0110)
    const prefix = user.username.replace(/^\D+/, "");
    if (!prefix) {
      // Fallback: get the latest note in the database
      const latestGeneral = await prisma.nota.findFirst({
        orderBy: { createdAt: "desc" },
        select: { nomorBukti: true }
      });
      return latestGeneral ? latestGeneral.nomorBukti : "01100000";
    }

    const latest = await prisma.nota.findFirst({
      where: {
        nomorBukti: {
          startsWith: prefix
        }
      },
      orderBy: {
        nomorBukti: "desc"
      },
      select: {
        nomorBukti: true
      }
    });

    return latest ? latest.nomorBukti : `${prefix}0000`;
  } catch (error) {
    console.error("Failed to get latest voucher number for user:", error);
    return null;
  }
}

export async function uploadNotaDocuments(notaId: string, formData: FormData) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };

    const files = formData.getAll("files") as File[];
    if (!files || files.length === 0) {
      return { error: "Tidak ada berkas yang dipilih." };
    }

    // Get current max order
    const maxDoc = await prisma.notaDokumen.findFirst({
      where: { notaId },
      orderBy: { order: "desc" },
    });
    let currentOrder = maxDoc ? maxDoc.order + 1 : 0;

    const uploadedDocs = [];
    for (const file of files) {
      if (file.size === 0) continue;

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploaded = await uploadFileToStorage(buffer, file.name, file.type);

      const doc = await prisma.notaDokumen.create({
        data: {
          notaId,
          filePath: uploaded.filePath,
          fileName: file.name,
          order: currentOrder++,
        },
      });
      uploadedDocs.push(doc);
    }

    revalidatePath(`/dashboard/vouchers/${notaId}`);
    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true, count: uploadedDocs.length };
  } catch (error) {
    console.error("Failed to upload documents:", error);
    return { error: "Gagal mengunggah berkas digital." };
  }
}

export async function deleteNotaDocument(documentId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };

    const doc = await prisma.notaDokumen.findUnique({
      where: { id: documentId },
    });
    if (!doc) return { error: "Dokumen tidak ditemukan." };

    // Delete file using storage module
    await deleteFileFromStorage(doc.filePath);

    await prisma.notaDokumen.delete({
      where: { id: documentId },
    });

    revalidatePath(`/dashboard/vouchers/${doc.notaId}`);
    revalidatePath("/dashboard/vouchers");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete document:", error);
    return { error: "Gagal menghapus berkas digital." };
  }
}

export async function reorderNotaDocuments(notaId: string, orderedIds: string[]) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { error: "Sesi Anda telah berakhir. Silakan login kembali." };

    await prisma.$transaction(
      orderedIds.map((id, index) =>
        prisma.notaDokumen.update({
          where: { id, notaId },
          data: { order: index },
        })
      )
    );

    revalidatePath(`/dashboard/vouchers/${notaId}`);
    return { success: true };
  } catch (error) {
    console.error("Failed to reorder documents:", error);
    return { error: "Gagal mengubah urutan berkas digital." };
  }
}
