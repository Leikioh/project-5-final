import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function getUserId(): Promise<number | null> {
  const store = await cookies(); // ← await
  const raw = store.get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

// GET /api/comments?recipeId=123
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const recipeId = Number(searchParams.get("recipeId"));
  if (!recipeId) {
    return NextResponse.json({ error: "Paramètre recipeId requis" }, { status: 400 });
  }

  const comments = await prisma.comment.findMany({
    where: { recipeId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(comments);
}

// POST /api/comments  { recipeId: number, content: string }
export async function POST(req: Request) {
  const userId = await getUserId(); // ← await
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { recipeId?: number; content?: string };
  try {
    body = (await req.json()) as { recipeId?: number; content?: string };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const recipeId = Number(body.recipeId);
  const content = (body.content ?? "").trim();
  if (!recipeId || !content) {
    return NextResponse.json({ error: "recipeId et content requis" }, { status: 400 });
  }

  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) return NextResponse.json({ error: "Recette introuvable" }, { status: 404 });

  const created = await prisma.comment.create({
    data: { content, recipeId, authorId: userId },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(created, { status: 201 });
}
