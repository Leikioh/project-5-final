import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function getUserId(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

// GET -> { liked, favoritesCount }
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const recipeId = Number(id);
  if (!Number.isFinite(recipeId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const userId = await getUserId();
  const liked = userId
    ? !!(await prisma.favorite.findUnique({
        where: { userId_recipeId: { userId, recipeId } },
      }))
    : false;

  const favoritesCount = await prisma.favorite.count({ where: { recipeId } });
  return NextResponse.json({ liked, favoritesCount });
}

// POST -> like
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await context.params;
  const recipeId = Number(id);
  if (!Number.isFinite(recipeId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  await prisma.favorite.upsert({
    where: { userId_recipeId: { userId, recipeId } },
    create: { userId, recipeId },
    update: {},
  });

  const favoritesCount = await prisma.favorite.count({ where: { recipeId } });
  return NextResponse.json({ liked: true, favoritesCount }, { status: 201 });
}

// DELETE -> unlike
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id } = await context.params;
  const recipeId = Number(id);
  if (!Number.isFinite(recipeId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  await prisma.favorite.delete({
    where: { userId_recipeId: { userId, recipeId } },
  }).catch(() => undefined); // ok si déjà supprimé

  const favoritesCount = await prisma.favorite.count({ where: { recipeId } });
  return NextResponse.json({ liked: false, favoritesCount });
}
