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

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const userId = await getUserId(); // ← await ici aussi
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const id = Number(params.id);
  if (!id) return NextResponse.json({ error: "ID invalide" }, { status: 400 });

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (comment.authorId !== userId) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.commentLike.deleteMany({ where: { commentId: id } }),
    prisma.comment.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
