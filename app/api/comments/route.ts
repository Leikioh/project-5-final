// app/api/comments/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma"; // ← default import

export const runtime = "nodejs";

function getUserId(req: NextRequest): number | null {
  const raw = req.cookies.get("userId")?.value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// GET /api/comments?recipeId=123
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const recipeId = Number(searchParams.get("recipeId"));
  if (!recipeId) {
    return NextResponse.json({ error: "Paramètre recipeId requis" }, { status: 400 });
  }

  // Pas de .map → pas d'implicit any
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
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { recipeId?: number; content?: string } = {};
  try {
    body = await req.json();
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
