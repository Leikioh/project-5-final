// app/api/comments/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getUserId(req: NextRequest): number | null {
  const raw = req.cookies.get("userId")?.value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  if (comment.authorId !== userId) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  // Supprimer d'abord les likes liés (au cas où) puis le comment
  await prisma.$transaction([
    prisma.commentLike.deleteMany({ where: { commentId: id } }),
    prisma.comment.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
