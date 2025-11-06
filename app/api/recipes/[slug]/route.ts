// app/api/recipes/[slug]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";
import { z } from "zod";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

/* ─────────── Auth helper ─────────── */
async function getUserId(): Promise<number | null> {
  const jar = await cookies();
  const raw = jar.get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

/* ─────────── Validation payload ─────────── */
const updateSchema = z.object({
  title: z.string().trim().min(3).max(200).optional(),
  description: z.string().trim().max(10_000).nullable().optional(),
  imageUrl: z.string().url().max(2_000).nullable().optional(),
  activeTime: z.string().trim().max(100).nullable().optional(),
  totalTime: z.string().trim().max(100).nullable().optional(),
  yield: z.string().trim().max(100).nullable().optional(),
  steps: z.array(z.string().trim().min(1).max(2000)).max(200).optional(),
  ingredients: z.array(z.string().trim().min(1).max(500)).max(500).optional(),
});
type UpdatePayload = z.infer<typeof updateSchema>;

/* ─────────── Types & SELECT commun ─────────── */
type RecipeFull = {
  id: number;
  title: string;
  slug: string | null;
  description: string | null;
  imageUrl: string | null;
  activeTime: string | null;
  totalTime: string | null;
  yield: string | null;
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  approvedAt: Date | null;
  rejectedAt: Date | null;
  deletedAt: Date | null;
  author: { id: number; name: string | null; email: string };
  steps: { id: number; text: string }[];
  ingredients: { id: number; name: string }[];
  _count: { favorites: number; comments: number };
};

const RECIPE_SELECT = {
  id: true,
  title: true,
  slug: true,
  description: true,
  imageUrl: true,
  activeTime: true,
  totalTime: true,
  yield: true,
  status: true,
  authorId: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  rejectedAt: true,
  deletedAt: true,
  author: { select: { id: true, name: true, email: true } },
  steps: { orderBy: { id: "asc" as const }, select: { id: true, text: true } },
  ingredients: { orderBy: { id: "asc" as const }, select: { id: true, name: true } },
  _count: { select: { favorites: true, comments: true } },
} as const;

/* ─────────── Slug utils ─────────── */
function buildSlugBase(title: string): string {
  return slugify(title) || "recette";
}

async function ensureUniqueSlugForId(id: number, base: string): Promise<string> {
  let candidate = `${base}-${id}`;
  try {
    await prisma.recipe.update({ where: { id }, data: { slug: candidate } });
    return candidate;
  } catch (e) {
    const maybe = e as { code?: string; meta?: { target?: unknown } };
    if (maybe.code === "P2002") {
      candidate = `${base}-${id}-${Date.now().toString(36)}`;
      await prisma.recipe.update({ where: { id }, data: { slug: candidate } });
      return candidate;
    }
    throw e;
  }
}

/* ─────────── Lecture par id OU slug (typée) ─────────── */
async function findRecipeFull(slugOrId: string): Promise<RecipeFull | null> {
  const asNum = Number(slugOrId);
  if (Number.isFinite(asNum)) {
    return prisma.recipe.findUnique({
      where: { id: asNum },
      select: RECIPE_SELECT,
    }) as Promise<RecipeFull | null>;
  }
  return prisma.recipe.findUnique({
    where: { slug: slugOrId },
    select: RECIPE_SELECT,
  }) as Promise<RecipeFull | null>;
}

/* ─────────── Sérialisation dates ─────────── */
function serializeRecipe(r: RecipeFull) {
  return {
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    approvedAt: r.approvedAt ? r.approvedAt.toISOString() : null,
    rejectedAt: r.rejectedAt ? r.rejectedAt.toISOString() : null,
    deletedAt: r.deletedAt ? r.deletedAt.toISOString() : null,
  };
}

/* ─────────── GET ─────────── */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const userId = await getUserId();

  const recipe = await findRecipeFull(slug);
  if (!recipe || recipe.deletedAt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Recette non publiée -> visible seulement par son auteur
  if (recipe.status !== "APPROVED" && recipe.authorId !== userId) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  return NextResponse.json(serializeRecipe(recipe));
}

/* ─────────── PUT (édition par l’auteur) ─────────── */
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { slug } = await params;

  // strict nécessaire pour contrôle et recalcul de slug
  const existing = await (async () => {
    const asNum = Number(slug);
    if (Number.isFinite(asNum)) {
      return prisma.recipe.findUnique({
        where: { id: asNum },
        select: { id: true, authorId: true, deletedAt: true, title: true, status: true },
      });
    }
    return prisma.recipe.findUnique({
      where: { slug },
      select: { id: true, authorId: true, deletedAt: true, title: true, status: true },
    });
  })();

  if (!existing || existing.deletedAt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }
  if (existing.authorId !== userId) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  let payload: UpdatePayload;
  try {
    payload = updateSchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const data: {
    title?: string;
    description?: string | null;
    imageUrl?: string | null;
    activeTime?: string | null;
    totalTime?: string | null;
    yield?: string | null;
    status?: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
    approvedAt?: Date | null;
    rejectedAt?: Date | null;
    rejectionReason?: string | null;
  } = {};

  if (payload.title !== undefined) data.title = payload.title;
  if (payload.description !== undefined) data.description = payload.description ?? null;
  if (payload.imageUrl !== undefined) data.imageUrl = payload.imageUrl ?? null;
  if (payload.activeTime !== undefined) data.activeTime = payload.activeTime ?? null;
  if (payload.totalTime !== undefined) data.totalTime = payload.totalTime ?? null;
  if (payload.yield !== undefined) data.yield = payload.yield ?? null;

  // si modifs et statut REJECTED -> repasse en PENDING (reset modération)
  if (
    existing.status === "REJECTED" &&
    (payload.title !== undefined ||
      payload.description !== undefined ||
      payload.imageUrl !== undefined ||
      payload.activeTime !== undefined ||
      payload.totalTime !== undefined ||
      payload.yield !== undefined ||
      payload.steps !== undefined ||
      payload.ingredients !== undefined)
  ) {
    data.status = "PENDING";
    data.approvedAt = null;
    data.rejectedAt = null;
    data.rejectionReason = null;
  }

  await prisma.$transaction(async (tx) => {
    if (Object.keys(data).length > 0) {
      await tx.recipe.update({ where: { id: existing.id }, data });
    }

    if (payload.steps !== undefined) {
      await tx.step.deleteMany({ where: { recipeId: existing.id } });
      if (payload.steps.length) {
        await tx.step.createMany({
          data: payload.steps.map((text) => ({ text, recipeId: existing.id })),
        });
      }
    }

    if (payload.ingredients !== undefined) {
      await tx.ingredient.deleteMany({ where: { recipeId: existing.id } });
      if (payload.ingredients.length) {
        await tx.ingredient.createMany({
          data: payload.ingredients.map((name) => ({ name, recipeId: existing.id })),
        });
      }
    }
  });

  if (payload.title && payload.title !== existing.title) {
    const base = buildSlugBase(payload.title);
    await ensureUniqueSlugForId(existing.id, base);
  }

  const updated = await findRecipeFull(String(existing.id));
  if (!updated) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json(serializeRecipe(updated));
}

/* ─────────── DELETE (suppression par l’auteur) ─────────── */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { slug } = await params;

  const recipe = await (async () => {
    const asNum = Number(slug);
    if (Number.isFinite(asNum)) {
      return prisma.recipe.findUnique({
        where: { id: asNum },
        select: { id: true, authorId: true },
      });
    }
    return prisma.recipe.findUnique({
      where: { slug },
      select: { id: true, authorId: true },
    });
  })();

  if (!recipe) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  if (recipe.authorId !== userId) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  await prisma.$transaction(async (tx) => {
    const commentIds = (
      await tx.comment.findMany({ where: { recipeId: recipe.id }, select: { id: true } })
    ).map((c) => c.id);

    if (commentIds.length) {
      await tx.commentLike.deleteMany({ where: { commentId: { in: commentIds } } });
    }

    await tx.comment.deleteMany({ where: { recipeId: recipe.id } });
    await tx.favorite.deleteMany({ where: { recipeId: recipe.id } });
    await tx.step.deleteMany({ where: { recipeId: recipe.id } });
    await tx.ingredient.deleteMany({ where: { recipeId: recipe.id } });
    await tx.recipe.delete({ where: { id: recipe.id } });
  });

  return NextResponse.json({ ok: true });
}
