// app/api/admin/comments/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  take: z.coerce.number().int().min(1).max(50).default(20),
  q: z.string().trim().max(200).optional(),
  visibility: z.enum(["all", "hidden", "visible"]).default("all"),
});

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const parsed = listQuery.safeParse({
    page: searchParams.get("page") ?? undefined,
    take: searchParams.get("take") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    visibility: searchParams.get("visibility") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  const { page, take, q, visibility } = parsed.data;

  // ⚠️ Pas de `mode: "insensitive"` (non supporté par ton provider)
  const where = {
    deletedAt: null as Date | null,
    ...(q
      ? {
          OR: [
            { content: { contains: q } },
            { author: { name: { contains: q } } },
            { recipe: { title: { contains: q } } },
          ],
        }
      : {}),
    ...(visibility === "hidden" ? { hidden: true } : {}),
    ...(visibility === "visible" ? { hidden: false } : {}),
  };

  const total = await prisma.comment.count({ where });

  const select = {
    id: true,
    content: true,
    hidden: true,
    createdAt: true,
    author: { select: { id: true, name: true, email: true } },
    recipe: { select: { id: true, title: true, slug: true} },
  } as const;

  const items = await prisma.comment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take,
    select,
  });

  type CommentListItem = (typeof items)[number];

  const payload = items.map((c: CommentListItem) => ({
    id: c.id,
    content: c.content,
    hidden: c.hidden,
    createdAt: c.createdAt.toISOString(),
    author: c.author,
    recipe: c.recipe,
  }));

  return NextResponse.json({
    items: payload,
    page,
    pageCount: Math.max(1, Math.ceil(total / take)),
    total,
  });
}
