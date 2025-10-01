// app/api/recipes/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";

export const runtime = "nodejs";

/* ─────────── Utils auth (cookie) ─────────── */
function getUserId(req: NextRequest): number | null {
  // Dans un route handler, NextRequest expose bien req.cookies (sync).
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

/* ─────────────── Helpers Slug ─────────────── */
async function makeUniqueSlug(baseTitle: string): Promise<string> {
  let base = slugify(baseTitle);
  if (!base) base = "recette";
  let slug = base;
  let i = 1;

  // Boucle jusqu’à trouver un slug libre
  // (peut encore rater en cas de course condition, on gère plus bas aussi côté create)
  while (true) {
    const exists = await prisma.recipe.findUnique({ where: { slug } });
    if (!exists) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

/* ───────────────── GET (liste) ───────────────── */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = (searchParams.get("q") ?? "").trim();

    // bornes de pagination
    const pageParam = Number(searchParams.get("page") ?? "");
    const takeParam = Number(searchParams.get("take") ?? "");
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : NaN;
    const takeRaw =
      Number.isFinite(takeParam) && takeParam > 0 ? takeParam : NaN;

    // limite de sécurité (évite de remonter 10k lignes)
    const TAKE_MAX = 50;
    const take = Number.isFinite(takeRaw)
      ? Math.min(TAKE_MAX, Math.max(1, takeRaw))
      : NaN;

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
    if (Number.isFinite(page) && Number.isFinite(take)) {
      const total = await prisma.recipe.count({ where });
      const pageCount = Math.max(1, Math.ceil(total / (take as number)));
      const skip = (page - 1) * (take as number);

      const items = await prisma.recipe.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: take as number,
        include: {
          author: { select: { id: true, name: true, email: true } },
          _count: { select: { favorites: true, comments: true } },
        },
      });

      return NextResponse.json({ items, total, page, pageCount });
    }

    // Sinon: liste complète (comportement historique)
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

/* ───────────────── POST (create) ──────────────── */
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

  // Nettoyage minimal
  const steps =
    Array.isArray(body.steps)
      ? body.steps.map((s) => s.trim()).filter(Boolean)
      : [];
  const ingredients =
    Array.isArray(body.ingredients)
      ? body.ingredients.map((s) => s.trim()).filter(Boolean)
      : [];

  try {
    // Slug unique (pré-calcul)
    let slug = await makeUniqueSlug(title);

    // Création
    // On rattrape une éventuelle collision de dernière seconde (P2002)
    try {
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
    } catch (e: unknown) {
      // @ts-expect-error prisma codes (pas besoin d’un type ici)
      if (e?.code === "P2002" && Array.isArray(e?.meta?.target) && e.meta.target.includes("slug")) {
        // Collision: régénère avec suffixe horodaté
        slug = `${slug}-${Date.now().toString(36)}`;
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
      }
      throw e;
    }
  } catch (err) {
    console.error("POST /api/recipes error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
