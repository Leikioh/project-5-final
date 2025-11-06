// app/api/admin/stats/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import type { AdminStats } from "@/lib/types/admin";

export const runtime = "nodejs";

// Type the subset we select from Prisma for latest pending recipes
type LatestPendingDb = {
  id: number;
  title: string;
  slug: string | null;
  createdAt: Date;
};

export async function GET(): Promise<NextResponse<AdminStats | { error: string }>> {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const [
    usersTotal,
    recipesTotal,
    recipesPending,
    recipesApproved,
    recipesRejected,
    commentsTotal,
    commentsHidden,
    latestPendingDb,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.recipe.count({ where: { deletedAt: null } }),
    prisma.recipe.count({ where: { deletedAt: null, status: "PENDING" } }),
    prisma.recipe.count({ where: { deletedAt: null, status: "APPROVED" } }),
    prisma.recipe.count({ where: { deletedAt: null, status: "REJECTED" } }),
    prisma.comment.count({ where: { deletedAt: null } }),
    prisma.comment.count({ where: { deletedAt: null, hidden: true } }),
    prisma.recipe.findMany({
      where: { deletedAt: null, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, slug: true, createdAt: true },
    }) as Promise<LatestPendingDb[]>,
  ]);

  const latestPending = latestPendingDb.map((r: LatestPendingDb) => ({
    id: r.id,
    title: r.title,
    slug: r.slug,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json({
    usersTotal,
    recipesTotal,
    recipesPending,
    recipesApproved,
    recipesRejected,
    commentsTotal,
    commentsHidden,
    latestPending,
  });
}
