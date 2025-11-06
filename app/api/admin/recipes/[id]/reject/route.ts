// app/api/admin/recipes/[id]/reject/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

export const runtime = "nodejs";

const bodySchema = z.object({
  reason: z.string().trim().max(1000).optional(),
});

type Params = { id: string };

export async function POST(
  req: Request,
  { params }: { params: Promise<Params> }
) {
  // 1) Auth admin
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 2) Params
  const { id: idParam } = await params;
  const idNum = Number(idParam);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  // 3) Body (tolère body vide)
  let reason: string | undefined;
  try {
    const raw = await req.text();
    if (raw) {
      const parsed = bodySchema.safeParse(JSON.parse(raw));
      if (!parsed.success) {
        return NextResponse.json({ error: "Bad Request" }, { status: 400 });
      }
      reason = parsed.data.reason;
    }
  } catch {
    return NextResponse.json({ error: "Bad Request" }, { status: 400 });
  }

  // 4) Update
  try {
    const updated = await prisma.recipe.update({
      where: { id: idNum },
      data: {
        status: "REJECTED",
        rejectedAt: new Date(),
        approvedAt: null,
        rejectionReason: reason ?? null,
      },
      select: {
        id: true,
        status: true,
        rejectedAt: true,
        rejectionReason: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e: unknown) {
    // P2025 = Record to update not found
    if (typeof e === "object" && e && "code" in e && (e as { code?: string }).code === "P2025") {
      return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
    }
    console.error("Reject recipe error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
