// app/api/admin/recipes/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  take: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["DRAFT", "PENDING", "APPROVED", "REJECTED"]).optional(),
  q: z.string().trim().max(200).optional(),
});

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = listQuery.safeParse({
    page: searchParams.get("page") ?? undefined,
    take: searchParams.get("take") ?? undefined,
    status: searchParams.get("status") ?? undefined,
    q: searchParams.get("q") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const { page, take, status, q } = parsed.data;

  // ❌ SUPPRIMÉ `mode: 'insensitive'` (non supporté par ton provider)
  const where = {
    deletedAt: null as Date | null,
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { slug: { contains: q } },
          ],
        }
      : {}),
  };

  const total = await prisma.recipe.count({ where });

  const select = {
    id: true,
    title: true,
    slug: true,
    status: true,
    createdAt: true,
    rejectionReason: true,
    author: { select: { id: true, name: true, email: true } },
  } as const;

  const items = await prisma.recipe.findMany({
    where,
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    skip: (page - 1) * take,
    take,
    select,
  });

  type RecipeListItem = (typeof items)[number];

  const payload = items.map((r: RecipeListItem) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    status: r.status,
    createdAt: r.createdAt.toISOString(),
    author: r.author,
    rejectionReason: r.rejectionReason ?? null,
  }));

  return NextResponse.json({
    items: payload,
    page,
    pageCount: Math.max(1, Math.ceil(total / take)),
    total,
  });
}
