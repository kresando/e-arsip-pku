import { prisma } from "../lib/db";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean existing records if any (optional, but good for a fresh start)
  // We delete in reverse order of foreign key relationships
  await prisma.nota.deleteMany();
  await prisma.pembungkus.deleteMany();
  await prisma.dus.deleteMany();
  await prisma.rak.deleteMany();
  await prisma.user.deleteMany();
  await prisma.divisi.deleteMany();

  // 2. Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash("4kl@sulut", salt);

  const admin = await prisma.user.create({
    data: {
      username: "divakl",
      name: "Admin Divisi AKL",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
    },
  });

  console.log("Users created:", { admin: admin.username });


  // 2.5 Create Divisions
  const divisions = [
    { namaDivisi: "Kredit & Pembiayaan", keterangan: "Divisi Kredit & Pembiayaan BSG" },
    { namaDivisi: "Operasional & Pelayanan", keterangan: "Divisi Operasional & Pelayanan BSG" },
    { namaDivisi: "Akuntansi & Keuangan", keterangan: "Divisi Akuntansi & Keuangan BSG" },
    { namaDivisi: "SDM & Hukum", keterangan: "Divisi Sumber Daya Manusia & Hukum BSG" },
    { namaDivisi: "Umum & Logistik", keterangan: "Divisi Umum & Logistik BSG" },
    { namaDivisi: "Audit Internal", keterangan: "Divisi Audit Internal BSG" },
    { namaDivisi: "Teknologi Informasi", keterangan: "Divisi Teknologi Informasi BSG" },
    { namaDivisi: "Lain-lain / Eksternal", keterangan: "Pihak luar / Eksternal BSG" },
  ];

  await prisma.divisi.createMany({
    data: divisions,
  });

  console.log("Divisions created");

  // 3. Create Shelves (Rak)
  const rakA = await prisma.rak.create({
    data: {
      namaRak: "Rak A",
      keterangan: "Rak Utama Bukti Pemindahbukuan PT. Bank SulutGo",
    },
  });

  const rakB = await prisma.rak.create({
    data: {
      namaRak: "Rak B",
      keterangan: "Rak Cadangan Arsip Journal Transaksi",
    },
  });

  console.log("Shelves (Rak) created:", [rakA.namaRak, rakB.namaRak]);

  // 4. Create Boxes (Dus)
  const dus1 = await prisma.dus.create({
    data: {
      namaDus: "Dus D-01/BSG",
      keterangan: "Dus Dokumen Transaksi Semester I 2026",
      rakId: rakA.id,
    },
  });

  const dus2 = await prisma.dus.create({
    data: {
      namaDus: "Dus D-02/BSG",
      keterangan: "Dus Dokumen Transaksi Semester II 2026",
      rakId: rakA.id,
    },
  });

  console.log("Boxes (Dus) created:", [dus1.namaDus, dus2.namaDus]);

  // 5. Create Wrappers (Pembungkus)
  const wrapper1 = await prisma.pembungkus.create({
    data: {
      namaPembungkus: "Pembungkus 29 Juni 2026",
      keterangan: "Map Merah Bukti Pemindahbukuan 29 Juni 2026",
      dusId: dus1.id,
    },
  });

  const wrapper2 = await prisma.pembungkus.create({
    data: {
      namaPembungkus: "Pembungkus 28 Juni 2026",
      keterangan: "Map Biru Bukti Pemindahbukuan 28 Juni 2026",
      dusId: dus2.id,
    },
  });

  console.log("Wrappers (Pembungkus) created:", [wrapper1.namaPembungkus, wrapper2.namaPembungkus]);

  // 6. Create Bukti Pemindahbukuan Sample
  const sampleVoucher = await prisma.nota.create({
    data: {
      nomorBukti: "JV-2026-06-0001",
      tanggalBukti: new Date("2026-06-29"),
      hari: "Senin",
      tanggal: 29,
      bulan: 6,
      tahun: 2026,
      keterangan: "Pemindahbukuan Kas Kantor Cabang Manado ke Kantor Pusat",
      pembungkusId: wrapper1.id,
      userId: admin.id,
    },
  });

  console.log("Sample Voucher created:", sampleVoucher.nomorBukti);
  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
