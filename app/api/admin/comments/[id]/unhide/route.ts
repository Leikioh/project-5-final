// app/api/admin/comments/[id]/hide/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { revalidateTag, revalidatePath } from "next/cache";

function commentsTag(recipeId: number) {
  return `recipe-comments-${recipeId}`;
}

export const runtime = "nodejs";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const commentId = Number(id);
  if (!Number.isFinite(commentId)) {
    return NextResponse.json({ error: "Bad id" }, { status: 400 });
  }

  // on récupère la recette associée
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    select: { id: true, hidden: true, recipeId: true, recipe: { select: { slug: true } } },
  });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.comment.update({
    where: { id: commentId },
    data: { hidden: false },
  });

  // 🔄 revalidation ciblée
  revalidateTag(commentsTag(comment.recipeId));
  if (comment.recipe?.slug) revalidatePath(`/recipes/${comment.recipe.slug}`);

  return NextResponse.json({ ok: true });
}
