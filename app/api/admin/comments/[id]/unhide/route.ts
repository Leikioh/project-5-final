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

  const { id } = await params;
  const commentId = Number(id);
  if (!Number.isFinite(commentId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const updated = await prisma.comment.update({
    where: { id: commentId, deletedAt: null },
    data: { hidden: false },
    select: { id: true, hidden: true },
  });

  return NextResponse.json(updated);
}
