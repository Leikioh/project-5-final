import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export async function getCurrentUser() {
  const jar = await cookies();
  const raw = jar.get("userId")?.value;
  const id = raw ? Number(raw) : NaN;
  if (!Number.isFinite(id)) return null;
  return prisma.user.findUnique({ where: { id }, select: { id: true, name: true, role: true } });
}

export async function requireAdmin(): Promise<{ id: number; role: "ADMIN" } | null> {
  const u = await getCurrentUser();
  if (!u || u.role !== "ADMIN") return null;
  return { id: u.id, role: "ADMIN" };
}
