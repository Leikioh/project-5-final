import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const id = Number(params.id);
  if (!Number.isFinite(id)) return NextResponse.json({ error: "Bad id" }, { status: 400 });

  const updated = await prisma.recipe.update({
    where: { id },
    data: { status: "REJECTED", rejectedAt: new Date(), approvedAt: null },
    select: { id: true, status: true, rejectedAt: true },
  });

  return NextResponse.json(updated);
}
