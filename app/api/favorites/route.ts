import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 24;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1") || 1);

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ items: [], total: 0, page, pageCount: 0 });
  }
  const userId = Number(session.user.id);

  const [total, rows] = await Promise.all([
    prisma.favorite.count({ where: { userId } }),
    prisma.favorite.findMany({
      where: { userId },
      orderBy: { recipe: { createdAt: "desc" } }, // trie par récettes récentes
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        recipe: {
          select: {
            id: true,
            title: true,
            imageUrl: true,
            slug: true,
            author: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  const items = rows.map(r => r.recipe);
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  return NextResponse.json({ items, total, page, pageCount });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const { recipeId } = await req.json();
  const userId = Number(session.user.id);

  await prisma.favorite.upsert({
    where: { userId_recipeId: { userId, recipeId } },
    create: { userId, recipeId },
    update: {}, // rien à mettre: déjà en favori
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const url = new URL(req.url);
  const recipeId = Number(url.searchParams.get("recipeId"));
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  await prisma.favorite.delete({
    where: { userId_recipeId: { userId: Number(session.user.id), recipeId } },
  });

  return NextResponse.json({ ok: true });
}
