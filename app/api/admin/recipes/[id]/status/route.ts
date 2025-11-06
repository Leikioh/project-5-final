// app/api/admin/recipes/[id]/status/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const recipeId = Number(id);
  if (!Number.isFinite(recipeId)) {
    return NextResponse.json({ error: "ID invalide" }, { status: 400 });
  }

  const { action } = (await req.json()) as { action?: "APPROVE" | "REJECT" };
  if (action !== "APPROVE" && action !== "REJECT") {
    return NextResponse.json({ error: "Action invalide" }, { status: 400 });
  }

  const data =
    action === "APPROVE"
      ? { status: "APPROVED" as const, approvedAt: new Date(), rejectedAt: null }
      : { status: "REJECTED" as const, rejectedAt: new Date(), approvedAt: null };

  const updated = await prisma.recipe.update({
    where: { id: recipeId },
    data,
    select: { id: true, title: true, status: true, approvedAt: true, rejectedAt: true },
  });

  return NextResponse.json(updated);
}
