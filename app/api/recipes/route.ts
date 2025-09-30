// app/api/recipes/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

function getUserId(req: NextRequest): number | null {
  const raw = req.cookies.get("userId")?.value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/* ───────────────── Types ───────────────── */
type CreateRecipeBody = {
  title?: string;
  description?: string | null;
  imageUrl?: string | null;
  activeTime?: string | null;
  totalTime?: string | null;
  yield?: string | null;
  steps?: string[];
  ingredients?: string[];
};

/* ─────────────── Helpers DB ─────────────── */
async function makeUniqueSlug(baseTitle: string): Promise<string> {
  let base = slugify(baseTitle);
  if (!base) base = "recette";
  let slug = base;
  let i = 1;

  // Vérifie l’unicité et suffixe si collision
  while (true) {
    const exists = await prisma.recipe.findUnique({ where: { slug } });
    if (!exists) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

/* ───────────────── GET ───────────────── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const pageParam = Number(searchParams.get("page") ?? "");
    const takeParam = Number(searchParams.get("take") ?? "");

    const where =
      q.length > 0
        ? {
            OR: [
              { title: { contains: q, mode: "insensitive" as const } },
              { description: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : undefined;

    // Pagination serveur si page & take valides
    if (Number.isFinite(pageParam) && Number.isFinite(takeParam) && pageParam > 0 && takeParam > 0) {
      const page = pageParam;
      const take = takeParam;

      const total = await prisma.recipe.count({ where });
      const pageCount = Math.max(1, Math.ceil(total / take));
      const skip = (page - 1) * take;

      const items = await prisma.recipe.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take,
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { favorites: true, comments: true } },
        },
      });

      return NextResponse.json({ items, total, page, pageCount });
    }

    // Sinon: renvoie la liste complète (comportement historique)
    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, name: true, email: true } },
        _count: { select: { favorites: true, comments: true } },
      },
    });

    return NextResponse.json(recipes);
  } catch (err) {
    console.error("GET /api/recipes error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

/* ───────────────── POST ──────────────── */
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: CreateRecipeBody;
  try {
    body = (await req.json()) as CreateRecipeBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const title = (body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "title requis" }, { status: 400 });

  const steps =
    Array.isArray(body.steps) ? body.steps.map((s) => s.trim()).filter(Boolean) : [];

  const ingredients =
    Array.isArray(body.ingredients) ? body.ingredients.map((s) => s.trim()).filter(Boolean) : [];

  try {
    // Slug unique
    const slug = await makeUniqueSlug(title);

    const created = await prisma.recipe.create({
      data: {
        title,
        slug,
        description: body.description ?? null,
        imageUrl: body.imageUrl ?? null,
        authorId: userId,
        activeTime: body.activeTime ?? null,
        totalTime: body.totalTime ?? null,
        yield: body.yield ?? null,
        steps: steps.length
          ? { create: steps.map((text) => ({ text })) }
          : undefined,
        ingredients: ingredients.length
          ? { create: ingredients.map((name) => ({ name })) }
          : undefined,
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
        steps: true,
        ingredients: true,
        _count: { select: { favorites: true, comments: true } },
      },
    });

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error("POST /api/recipes error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
