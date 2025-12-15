// lib/auth.ts
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import type { NextAuthOptions } from "next-auth";

export async function requireUser() {
  const store = await cookies();
  const raw = store.get("userId")?.value;
  const id = raw ? Number(raw) : NaN;
  if (!Number.isFinite(id)) return null;

  return prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true, role: true },
  });
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export const authOptions: NextAuthOptions = {
  providers: []
};