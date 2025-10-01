// app/api/recipes/[slug]/favorite/route.ts
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

async function resolveRecipeId(slugOrId: string): Promise<number | null> {
  const asNum = Number(slugOrId);
  if (Number.isFinite(asNum)) return asNum;
  const r = await prisma.recipe.findUnique({ where: { slug: slugOrId }, select: { id: true } });
  return r?.id ?? null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const recipeId = await resolveRecipeId(slug);
  if (!recipeId) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const userId = await getUserId();
  const liked = userId
    ? !!(await prisma.favorite.findUnique({ where: { userId_recipeId: { userId, recipeId } } }))
    : false;

  const favoritesCount = await prisma.favorite.count({ where: { recipeId } });
  return NextResponse.json({ liked, favoritesCount });
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { slug } = await params;
  const recipeId = await resolveRecipeId(slug);
  if (!recipeId) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.favorite.upsert({
    where: { userId_recipeId: { userId, recipeId } },
    create: { userId, recipeId },
    update: {},
  });

  const favoritesCount = await prisma.favorite.count({ where: { recipeId } });
  return NextResponse.json({ liked: true, favoritesCount }, { status: 201 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { slug } = await params;
  const recipeId = await resolveRecipeId(slug);
  if (!recipeId) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  await prisma.favorite
    .delete({ where: { userId_recipeId: { userId, recipeId } } })
    .catch(() => undefined);

  const favoritesCount = await prisma.favorite.count({ where: { recipeId } });
  return NextResponse.json({ liked: false, favoritesCount });
}
