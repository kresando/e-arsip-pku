"use server";

import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

// ==========================================
// RAK ACTIONS
// ==========================================

export async function getRakList() {
  try {
    return await prisma.rak.findMany({
      include: {
        duses: {
          include: {
            pembungkuses: true,
          },
        },
      },
      orderBy: { namaRak: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch Rak:", error);
    return [];
  }
}

export async function createRak(data: { namaRak: string; keterangan?: string }) {
  try {
    const existing = await prisma.rak.findUnique({ where: { namaRak: data.namaRak } });
    if (existing) return { error: `Rak dengan nama "${data.namaRak}" sudah ada.` };

    const newRak = await prisma.rak.create({
      data: {
        namaRak: data.namaRak,
        keterangan: data.keterangan || null,
      },
    });
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/vouchers");
    return { success: true, data: newRak };
  } catch (error) {
    console.error("Failed to create Rak:", error);
    return { error: "Gagal membuat Rak baru" };
  }
}

export async function updateRak(id: string, data: { namaRak: string; keterangan?: string }) {
  try {
    const existing = await prisma.rak.findFirst({
      where: {
        namaRak: data.namaRak,
        id: { not: id },
      },
    });
    if (existing) return { error: `Rak dengan nama "${data.namaRak}" sudah digunakan.` };

    const updated = await prisma.rak.update({
      where: { id },
      data: {
        namaRak: data.namaRak,
        keterangan: data.keterangan || null,
      },
    });
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/vouchers");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update Rak:", error);
    return { error: "Gagal memperbarui Rak" };
  }
}

export async function deleteRak(id: string) {
  try {
    await prisma.rak.delete({ where: { id } });
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/vouchers");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete Rak:", error);
    return { error: "Gagal menghapus Rak. Pastikan Rak tidak digunakan oleh item lain." };
  }
}

// ==========================================
// DUS ACTIONS
// ==========================================

export async function getDusList() {
  try {
    return await prisma.dus.findMany({
      include: {
        rak: true,
        pembungkuses: true,
      },
      orderBy: { namaDus: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch Dus:", error);
    return [];
  }
}

export async function createDus(data: { namaDus: string; keterangan?: string; rakId?: string }) {
  try {
    const existing = await prisma.dus.findUnique({ where: { namaDus: data.namaDus } });
    if (existing) return { error: `Dus dengan nama "${data.namaDus}" sudah ada.` };

    const newDus = await prisma.dus.create({
      data: {
        namaDus: data.namaDus,
        keterangan: data.keterangan || null,
        rakId: data.rakId || null,
      },
    });
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/vouchers");
    return { success: true, data: newDus };
  } catch (error) {
    console.error("Failed to create Dus:", error);
    return { error: "Gagal membuat Dus baru" };
  }
}

export async function updateDus(id: string, data: { namaDus: string; keterangan?: string; rakId?: string }) {
  try {
    const existing = await prisma.dus.findFirst({
      where: {
        namaDus: data.namaDus,
        id: { not: id },
      },
    });
    if (existing) return { error: `Dus dengan nama "${data.namaDus}" sudah digunakan.` };

    const updated = await prisma.dus.update({
      where: { id },
      data: {
        namaDus: data.namaDus,
        keterangan: data.keterangan || null,
        rakId: data.rakId || null,
      },
    });
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/vouchers");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update Dus:", error);
    return { error: "Gagal memperbarui Dus" };
  }
}

export async function deleteDus(id: string) {
  try {
    await prisma.dus.delete({ where: { id } });
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/vouchers");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete Dus:", error);
    return { error: "Gagal menghapus Dus. Pastikan Dus tidak digunakan oleh item lain." };
  }
}

// ==========================================
// PEMBUNGKUS ACTIONS
// ==========================================

export async function getPembungkusList() {
  try {
    return await prisma.pembungkus.findMany({
      include: {
        dus: {
          include: {
            rak: true,
          },
        },
        notas: true,
      },
      orderBy: { namaPembungkus: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch Pembungkus:", error);
    return [];
  }
}

export async function createPembungkus(data: { namaPembungkus: string; keterangan?: string; dusId?: string }) {
  try {
    const existing = await prisma.pembungkus.findUnique({ where: { namaPembungkus: data.namaPembungkus } });
    if (existing) return { error: `Pembungkus dengan nama "${data.namaPembungkus}" sudah ada.` };

    const newPembungkus = await prisma.pembungkus.create({
      data: {
        namaPembungkus: data.namaPembungkus,
        keterangan: data.keterangan || null,
        dusId: data.dusId || null,
      },
    });
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/vouchers");
    return { success: true, data: newPembungkus };
  } catch (error) {
    console.error("Failed to create Pembungkus:", error);
    return { error: "Gagal membuat Pembungkus baru" };
  }
}

export async function updatePembungkus(id: string, data: { namaPembungkus: string; keterangan?: string; dusId?: string }) {
  try {
    const existing = await prisma.pembungkus.findFirst({
      where: {
        namaPembungkus: data.namaPembungkus,
        id: { not: id },
      },
    });
    if (existing) return { error: `Pembungkus dengan nama "${data.namaPembungkus}" sudah digunakan.` };

    const updated = await prisma.pembungkus.update({
      where: { id },
      data: {
        namaPembungkus: data.namaPembungkus,
        keterangan: data.keterangan || null,
        dusId: data.dusId || null,
      },
    });
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/vouchers");
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to update Pembungkus:", error);
    return { error: "Gagal memperbarui Pembungkus" };
  }
}

export async function deletePembungkus(id: string) {
  try {
    await prisma.pembungkus.delete({ where: { id } });
    revalidatePath("/dashboard/locations");
    revalidatePath("/dashboard/vouchers");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete Pembungkus:", error);
    return { error: "Gagal menghapus Pembungkus. Pastikan Pembungkus tidak digunakan oleh nota." };
  }
}
