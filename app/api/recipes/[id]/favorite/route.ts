// app/api/recipes/[id]/favorite/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function getUserId(): number | null {
  const raw = cookies().get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

// GET -> renvoie { liked, favoritesCount }
export async function GET(_req: Request, context: { params: { id: string } }) {
  const recipeId = Number(context.params.id);
  if (!Number.isFinite(recipeId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const userId = getUserId();
  const favoritesCount = await prisma.favorite.count({ where: { recipeId } });

  if (!userId) {
    return NextResponse.json({ liked: false, favoritesCount });
  }

  const fav = await prisma.favorite.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });

  return NextResponse.json({ liked: !!fav, favoritesCount });
}

// POST -> toggle puis renvoie { liked, favoritesCount }
export async function POST(_req: Request, context: { params: { id: string } }) {
  const userId = getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const recipeId = Number(context.params.id);
  if (!Number.isFinite(recipeId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const existing = await prisma.favorite.findUnique({
    where: { userId_recipeId: { userId, recipeId } },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: { userId_recipeId: { userId, recipeId } },
    });
  } else {
    await prisma.favorite.create({ data: { userId, recipeId } });
  }

  const favoritesCount = await prisma.favorite.count({ where: { recipeId } });
  return NextResponse.json({ liked: !existing, favoritesCount });
}
