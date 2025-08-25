// app/api/recipes/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

function getUserId(req: NextRequest): number | null {
  const raw = req.cookies.get("userId")?.value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

type UpdateRecipeBody = {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  activeTime?: string | null;
  totalTime?: string | null;
  yield?: string | null;
  steps?: string[];
  ingredients?: string[];
};

async function readRecipe(id: number) {
  return prisma.recipe.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      steps: { orderBy: { id: "asc" } },
      ingredients: { orderBy: { id: "asc" } },
      _count: { select: { favorites: true, comments: true } },
    },
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const recipe = await readRecipe(id);
  if (!recipe) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(recipe);
}

// PUT /api/recipes/:id
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (recipe.authorId !== userId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const body = bodyUnknown as UpdateRecipeBody;

  const steps: string[] = Array.isArray(body.steps)
    ? body.steps.map((s: string) => s.trim()).filter(Boolean)
    : [];

  const ingredients: string[] = Array.isArray(body.ingredients)
    ? body.ingredients.map((s: string) => s.trim()).filter(Boolean)
    : [];

  // ✅ Typage pris depuis Prisma
  const updateData: Prisma.RecipeUpdateArgs["data"] = {
    title: body.title ?? recipe.title,
    description: body.description ?? recipe.description,
    imageUrl: body.imageUrl ?? recipe.imageUrl,
    activeTime: body.activeTime ?? recipe.activeTime,
    totalTime: body.totalTime ?? recipe.totalTime,
    yield: body.yield ?? recipe.yield,
  };

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.recipe.update({ where: { id }, data: updateData });

    if (Array.isArray(body.steps)) {
      await tx.step.deleteMany({ where: { recipeId: id } });
      if (steps.length) {
        await tx.step.createMany({
          data: steps.map((text: string) => ({ text, recipeId: id })),
        });
      }
    }

    if (Array.isArray(body.ingredients)) {
      await tx.ingredient.deleteMany({ where: { recipeId: id } });
      if (ingredients.length) {
        await tx.ingredient.createMany({
          data: ingredients.map((name: string) => ({ name, recipeId: id })),
        });
      }
    }
  });

  const updated = await readRecipe(id);
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (recipe.authorId !== userId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const commentIds = (
      await tx.comment.findMany({
        where: { recipeId: id },
        select: { id: true },
      })
    ).map((c: { id: number }) => c.id);

    if (commentIds.length) {
      await tx.commentLike.deleteMany({ where: { commentId: { in: commentIds } } });
    }
    await tx.comment.deleteMany({ where: { recipeId: id } });
    await tx.favorite.deleteMany({ where: { recipeId: id } });
    await tx.step.deleteMany({ where: { recipeId: id } });
    await tx.ingredient.deleteMany({ where: { recipeId: id } });
    await tx.recipe.delete({ where: { id } });
  });

  return NextResponse.json({ ok: true });
}
