import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";

async function getUserId(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
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
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const recipe = await readRecipe(id);
  if (!recipe) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(recipe);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (recipe.authorId !== userId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  let body: UpdateRecipeBody;
  try {
    body = (await req.json()) as UpdateRecipeBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const steps = Array.isArray(body.steps) ? body.steps.map((s) => s.trim()).filter(Boolean) : [];
  const ingredients = Array.isArray(body.ingredients) ? body.ingredients.map((s) => s.trim()).filter(Boolean) : [];

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
        await tx.step.createMany({ data: steps.map((text) => ({ text, recipeId: id })) });
      }
    }

    if (Array.isArray(body.ingredients)) {
      await tx.ingredient.deleteMany({ where: { recipeId: id } });
      if (ingredients.length) {
        await tx.ingredient.createMany({ data: ingredients.map((name) => ({ name, recipeId: id })) });
      }
    }
  });

  const updated = await readRecipe(id);
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (recipe.authorId !== userId) return NextResponse.json({ error: "Interdit" }, { status: 403 });

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const commentIds = (
      await tx.comment.findMany({ where: { recipeId: id }, select: { id: true } })
    ).map((c) => c.id);

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
