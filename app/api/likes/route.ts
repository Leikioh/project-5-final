import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

async function getUserId(): Promise<number | null> {
  const c = await cookies();
  const raw = c.get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const commentId = Number(searchParams.get("commentId"));
  if (!commentId) {
    return NextResponse.json({ error: "commentId requis" }, { status: 400 });
  }
  const count = await prisma.commentLike.count({ where: { commentId } });
  return NextResponse.json({ count });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { commentId?: number; action?: "like" | "unlike" | "toggle" };
  try {
    body = (await req.json()) as { commentId?: number; action?: "like" | "unlike" | "toggle" };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const commentId = Number(body.commentId);
  const action = (body.action ?? "toggle") as "like" | "unlike" | "toggle";
  if (!commentId) return NextResponse.json({ error: "commentId requis" }, { status: 400 });

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });

  const key = { userId_commentId: { userId, commentId } } as const;

  if (action === "like") {
    await prisma.commentLike.upsert({ where: key, update: {}, create: { userId, commentId } });
  } else if (action === "unlike") {
    await prisma.commentLike.deleteMany({ where: { userId, commentId } });
  } else {
    const already = await prisma.commentLike.findUnique({ where: key });
    if (already) await prisma.commentLike.delete({ where: key });
    else await prisma.commentLike.create({ data: { userId, commentId } });
  }

  const count = await prisma.commentLike.count({ where: { commentId } });
  const liked = !!(await prisma.commentLike.findUnique({ where: key }));
  return NextResponse.json({ liked, count });
}
