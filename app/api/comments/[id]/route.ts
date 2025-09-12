import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function getUserId(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const comment = await prisma.comment.findUnique({ where: { id } });
  if (!comment) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (comment.authorId !== userId) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  await prisma.$transaction([
    prisma.commentLike.deleteMany({ where: { commentId: id } }),
    prisma.comment.delete({ where: { id } }),
  ]);

  return NextResponse.json({ ok: true });
}
