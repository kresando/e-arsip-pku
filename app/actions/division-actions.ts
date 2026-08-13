"use server";

import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDivisionList() {
  try {
    return await prisma.divisi.findMany({
      orderBy: { namaDivisi: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch divisions:", error);
    return [];
  }
}

export async function createDivision(prevState: any, formData: FormData) {
  const namaDivisi = formData.get("namaDivisi") as string;
  const keterangan = formData.get("keterangan") as string;

  if (!namaDivisi?.trim()) {
    return { error: "Nama Divisi wajib diisi" };
  }

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: "Sesi tidak valid, silakan masuk kembali" };
    }

    const existing = await prisma.divisi.findUnique({
      where: { namaDivisi: namaDivisi.trim() },
    });

    if (existing) {
      return { error: "Nama Divisi sudah digunakan" };
    }

    await prisma.divisi.create({
      data: {
        namaDivisi: namaDivisi.trim(),
        keterangan: keterangan?.trim() || null,
      },
    });

    revalidatePath("/dashboard/divisions");
    revalidatePath("/dashboard/vouchers");
    return { success: true };
  } catch (error) {
    console.error("Create division error:", error);
    return { error: "Gagal membuat divisi baru" };
  }
}

export async function updateDivision(divisionId: string, data: { namaDivisi: string; keterangan?: string }) {
  if (!data.namaDivisi?.trim()) {
    return { error: "Nama Divisi wajib diisi" };
  }

  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: "Sesi tidak valid, silakan masuk kembali" };
    }

    const existing = await prisma.divisi.findFirst({
      where: {
        namaDivisi: data.namaDivisi.trim(),
        NOT: { id: divisionId },
      },
    });

    if (existing) {
      return { error: "Nama Divisi sudah digunakan oleh divisi lain" };
    }

    await prisma.divisi.update({
      where: { id: divisionId },
      data: {
        namaDivisi: data.namaDivisi.trim(),
        keterangan: data.keterangan?.trim() || null,
      },
    });

    revalidatePath("/dashboard/divisions");
    revalidatePath("/dashboard/vouchers");
    return { success: true };
  } catch (error) {
    console.error("Update division error:", error);
    return { error: "Gagal mengubah divisi" };
  }
}

export async function deleteDivision(divisionId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: "Sesi tidak valid, silakan masuk kembali" };
    }

    await prisma.divisi.delete({
      where: { id: divisionId },
    });

    revalidatePath("/dashboard/divisions");
    revalidatePath("/dashboard/vouchers");
    return { success: true };
  } catch (error) {
    console.error("Delete division error:", error);
    return { error: "Gagal menghapus divisi. Pastikan divisi tidak sedang dikaitkan dengan riwayat peminjaman." };
  }
}
