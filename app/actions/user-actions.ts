"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { comparePassword, encrypt } from "@/lib/auth";

export async function loginAction(prevState: any, formData: FormData) {
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;

  if (!username || !password) {
    return { error: "Username dan Password wajib diisi" };
  }

  try {
    // Find user in PostgreSQL
    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() },
    });

    if (!user) {
      return { error: "Username atau Password salah" };
    }

    // Verify Password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return { error: "Username atau Password salah" };
    }

    // Encrypt JWT session
    const sessionToken = await encrypt({
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
    });

    // Save session in HttpOnly Cookie
    const cookieStore = await cookies();
    cookieStore.set("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    });
  } catch (error) {
    console.error("Login action error:", error);
    return { error: "Terjadi kesalahan sistem, silakan coba lagi" };
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("session");
  redirect("/login");
}

export async function getUserList() {
  try {
    return await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
}

import bcrypt from "bcryptjs";
import { getCurrentUser } from "@/lib/auth";

export async function createUser(prevState: any, formData: FormData) {
  const username = (formData.get("username") as string)?.toLowerCase().trim();
  const name = formData.get("name") as string;

  if (!username || !name) {
    return { error: "Nama dan Username wajib diisi" };
  }

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });
    if (existingUser) {
      return { error: "Username sudah digunakan" };
    }

    const salt = await bcrypt.genSalt(10);
    const randomPassword = Math.random().toString(36) + Date.now().toString();
    const passwordHash = await bcrypt.hash(randomPassword, salt);

    await prisma.user.create({
      data: {
        username,
        name,
        role: "ADMIN",
        passwordHash,
      },
    });
  } catch (error) {
    console.error("Create user error:", error);
    return { error: "Gagal membuat user baru" };
  }

  return { success: true };
}

export async function deleteUser(userId: string) {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { error: "Sesi tidak valid, silakan masuk kembali" };
    }

    if (currentUser.id === userId) {
      return { error: "Tidak dapat menghapus akun Anda sendiri" };
    }

    await prisma.user.delete({
      where: { id: userId },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    return { error: "Gagal menghapus user" };
  }

  return { success: true };
}
