import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // Vérifie existence
  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Suppression forte + cascade manuelle
  await prisma.$transaction(async (tx) => {
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
