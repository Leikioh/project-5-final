// app/api/comments/[id]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth"; // => retourne { id, role } ou null

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function DELETE(_req: Request, { params }: Params) {
  const me = await requireUser();
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const idNum = Number(params.id);
  if (!Number.isFinite(idNum)) {
    return NextResponse.json({ error: "Bad comment id" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id: idNum },
    select: { id: true, authorId: true, recipe: { select: { authorId: true } } },
  });
  if (!comment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isAdmin = me.role === "ADMIN";
  const isAuthor = comment.authorId === me.id;
  const isRecipeOwner = comment.recipe.authorId === me.id;

  if (!isAdmin && !isAuthor && !isRecipeOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // soft delete (cohérent avec ton back-office)
  await prisma.comment.update({
    where: { id: idNum },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
