import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const take = Math.min(50, Math.max(1, Number(searchParams.get("take") ?? "20")));
  const status = searchParams.get("status") ?? undefined; // PENDING/APPROVED/REJECTED
  const q = (searchParams.get("q") ?? "").trim();

  const where: any = { deletedAt: null };
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const total = await prisma.recipe.count({ where });
  const items = await prisma.recipe.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    skip: (page - 1) * take,
    take,
    select: {
      id: true, title: true, slug: true, status: true, createdAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    items,
    page,
    pageCount: Math.max(1, Math.ceil(total / take)),
    total,
  });
}
