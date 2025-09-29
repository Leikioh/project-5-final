import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ← default import

export const runtime = "nodejs";

function getUserId(req: NextRequest): number | null {
  const raw = req.cookies.get("userId")?.value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

type CreateRecipeBody = {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  activeTime?: string | null;
  totalTime?: string | null;
  yield?: string | null;
  steps?: string[];
  ingredients?: string[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const recipes = await prisma.recipe.findMany({
    where: q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, email: true } },
      _count: { select: { favorites: true, comments: true } },
    },
  });

  return NextResponse.json(recipes);
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const body = bodyUnknown as CreateRecipeBody;

  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title requis" }, { status: 400 });

  const steps: string[] = Array.isArray(body.steps)
    ? body.steps.map((s: string) => s.trim()).filter(Boolean)
    : [];

  const ingredients: string[] = Array.isArray(body.ingredients)
    ? body.ingredients.map((s: string) => s.trim()).filter(Boolean)
    : [];

  const created = await prisma.recipe.create({
    data: {
      title,
      description: body.description ?? null,
      imageUrl: body.imageUrl ?? null,
      authorId: userId,
      activeTime: body.activeTime ?? null,
      totalTime: body.totalTime ?? null,
      yield: body.yield ?? null,
      steps: steps.length ? { create: steps.map((text: string) => ({ text })) } : undefined,
      ingredients: ingredients.length ? { create: ingredients.map((name: string) => ({ name })) } : undefined,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
      steps: true,
      ingredients: true,
      _count: { select: { favorites: true, comments: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
