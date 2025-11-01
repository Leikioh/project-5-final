// app/api/admin/comments/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const take = Math.min(50, Math.max(1, Number(searchParams.get("take") ?? "20")));
  const q = (searchParams.get("q") ?? "").trim();

  const where: any = { deletedAt: null };
  if (q) where.text = { contains: q, mode: "insensitive" };

  const total = await prisma.comment.count({ where });
  const items = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take,
    select: {
      id: true, text: true, hidden: true, createdAt: true,
      user: { select: { id: true, name: true, email: true } },
      recipe: { select: { id: true, title: true, slug: true } },
    },
  });

  return NextResponse.json({ items, page, pageCount: Math.max(1, Math.ceil(total / take)), total });
}
