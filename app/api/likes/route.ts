// app/api/likes/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function getUserId(req: NextRequest): number | null {
  const raw = req.cookies.get("userId")?.value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

// GET /api/likes?commentId=123
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const commentId = Number(searchParams.get("commentId"));
  if (!commentId) {
    return NextResponse.json({ error: "Paramètre commentId requis" }, { status: 400 });
  }

  const count = await prisma.commentLike.count({ where: { commentId } });
  return NextResponse.json({ count });
}

// POST /api/likes  { commentId: number, action?: 'like' | 'unlike' | 'toggle' }
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { commentId?: number; action?: "like" | "unlike" | "toggle" } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const commentId = Number(body.commentId);
  const action = body.action ?? "toggle";

  if (!commentId) {
    return NextResponse.json({ error: "commentId requis" }, { status: 400 });
  }

  const exists = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!exists) return NextResponse.json({ error: "Commentaire introuvable" }, { status: 404 });

  const key = { userId_commentId: { userId, commentId } };

  if (action === "like") {
    await prisma.commentLike.upsert({
      where: key,
      update: {},
      create: { userId, commentId },
    });
  } else if (action === "unlike") {
    await prisma.commentLike.deleteMany({ where: { userId, commentId } });
  } else {
    // toggle
    const already = await prisma.commentLike.findUnique({ where: key });
    if (already) {
      await prisma.commentLike.delete({ where: key });
    } else {
      await prisma.commentLike.create({ data: { userId, commentId } });
    }
  }

  const count = await prisma.commentLike.count({ where: { commentId } });
  const liked = !!(await prisma.commentLike.findUnique({ where: key }));
  return NextResponse.json({ liked, count });
}
