// app/api/recipes/[slug]/comments/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params; // Next 15: attendre params
  const maybeNum = Number(slug);
  const where =
    Number.isFinite(maybeNum) ? { id: maybeNum } : { slug }; // ← supporte id OU slug

  const recipe = await prisma.recipe.findUnique({
    where,
    select: { id: true },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  const rows = await prisma.comment.findMany({
    where: {
      recipeId: recipe.id,
      deletedAt: null,
      hidden: false, // les commentaires masqués ne doivent pas remonter côté recette
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      content: true,
      createdAt: true,
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    items: rows.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      author: c.author,
    })),
  });
}
