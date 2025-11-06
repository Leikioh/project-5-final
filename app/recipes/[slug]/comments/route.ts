// app/api/recipes/[slug]/comments/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

function commentsTag(recipeId: number) {
  return `recipe-comments-${recipeId}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (!recipe) {
    return NextResponse.json({ items: [] });
  }

  const comments = await prisma.comment.findMany({
    where: {
      recipeId: recipe.id,
      deletedAt: null,
      hidden: false, // ⬅️ important : ne pas renvoyer les masqués
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  // marquer la réponse avec un tag pour revalidation ciblée
  const res = NextResponse.json({
    items: comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  });
  // Next 15: x-next-cache-tags pour revalidateTag
  res.headers.set("x-next-cache-tags", commentsTag(recipe.id));
  return res;
}
