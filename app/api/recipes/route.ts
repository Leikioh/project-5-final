// app/api/recipes/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { slugify } from "@/lib/slugify";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

/* ─────────── Auth via cookie (NextRequest) ─────────── */
function getUserId(req: NextRequest): number | null {
  const raw = req.cookies.get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

/* ─────────── Helpers longueur (anti-P2000 MySQL) ─────────── */
const SAFE_VARCHAR = 180; // marge sous 191
const clamp = (s: string, max = SAFE_VARCHAR) => (s.length > max ? s.slice(0, max) : s);

/* ─────────── Validation ─────────── */
const createSchema = z.object({
  title: z.string().trim().min(3).max(200),
  description: z.string().trim().max(10_000).optional().nullable(),
  activeTime: z.string().trim().max(100).optional().nullable(),
  totalTime: z.string().trim().max(100).optional().nullable(),
  yield: z.string().trim().max(100).optional().nullable(),
  steps: z.array(z.string().trim().min(1).max(2000)).max(200).default([]),
  ingredients: z.array(z.string().trim().min(1).max(500)).max(500).default([]),
});
type CreatePayload = z.infer<typeof createSchema>;

/* ─────────── Upload utils ─────────── */
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

async function saveUploadedImage(file: File): Promise<string> {
  if (file.size > MAX_FILE_BYTES) throw new Error("Image trop lourde (max 8MB).");
  if (file.type && !ALLOWED_MIME.has(file.type)) throw new Error("Format d’image non autorisé (jpeg/png/webp/avif).");

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const mime = file.type || "application/octet-stream";
  const extFromMime = mime.includes("/") ? mime.split("/")[1] : "";
  const extFromName = (file.name || "").split(".").pop() || "";
  const ext = (extFromMime || extFromName || "bin").toLowerCase().replace(/[^a-z0-9]/g, "") || "bin";

  const fname = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fname), buffer);

  // Chemin relatif (public)
  return `/uploads/${fname}`;
}

function isMultipart(req: NextRequest): boolean {
  const ct = req.headers.get("content-type") || "";
  return ct.toLowerCase().includes("multipart/form-data");
}

async function parseMultipart(req: NextRequest): Promise<{ payload: CreatePayload; imageFile: File | null }> {
  const form = await req.formData();

  const payloadRaw = {
    title: String(form.get("title") ?? ""),
    description: (form.get("description") as string | null) ?? null,
    activeTime: (form.get("activeTime") as string | null) ?? null,
    totalTime: (form.get("totalTime") as string | null) ?? null,
    yield: (form.get("yield") as string | null) ?? null,
    steps: (form.getAll("steps[]") as string[]).map((s) => s.trim()).filter(Boolean),
    ingredients: (form.getAll("ingredients[]") as string[]).map((s) => s.trim()).filter(Boolean),
  };

  const parsed = createSchema.safeParse(payloadRaw);
  if (!parsed.success) throw new Error("Invalid multipart payload");

  const image = (form.get("image") as File | null) || null;
  return { payload: parsed.data, imageFile: image && image.size > 0 ? image : null };
}

async function parseJson(req: NextRequest): Promise<CreatePayload> {
  const raw = await req.json();
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success) throw new Error("Invalid JSON payload");
  return parsed.data;
}

/* ───────────────── POST (create) ──────────────── */
export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  try {
    // 1) Lire les données (JSON ou multipart)
    let payload: CreatePayload;
    let imageUrl: string | null = null;

    if (isMultipart(req)) {
      const { payload: p, imageFile } = await parseMultipart(req);
      payload = p;
      if (imageFile) {
        imageUrl = await saveUploadedImage(imageFile);
      }
    } else {
      payload = await parseJson(req);
    }

    const { title, description, activeTime, totalTime, yield: yieldVal, steps, ingredients } = payload;

    // 2) Clamp des champs susceptibles d’être en VARCHAR(191) dans ta DB
    const stepsClamped = steps.map((t) => clamp(t));
    const ingredientsClamped = ingredients.map((n) => clamp(n));

    // 3) Créer la recette (status PENDING), slug après
    const created = await prisma.recipe.create({
      data: {
        title: clamp(title, 200),
        description: description ?? null,
        imageUrl,
        activeTime: activeTime ? clamp(activeTime, 100) : null,
        totalTime: totalTime ? clamp(totalTime, 100) : null,
        yield: yieldVal ? clamp(yieldVal, 100) : null,
        authorId: userId,
        status: "PENDING",
        steps: stepsClamped.length ? { create: stepsClamped.map((text) => ({ text })) } : undefined,
        ingredients: ingredientsClamped.length ? { create: ingredientsClamped.map((name) => ({ name })) } : undefined,
      },
      select: { id: true, title: true },
    });

    // 4) Slug unique basé sur title + id
    const base = slugify(title) || "recette";
    let finalSlug = `${base}-${created.id}`;
    try {
      await prisma.recipe.update({ where: { id: created.id }, data: { slug: finalSlug } });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      if (e?.code === "P2002") {
        finalSlug = `${base}-${created.id}-${Date.now().toString(36)}`;
        await prisma.recipe.update({ where: { id: created.id }, data: { slug: finalSlug } });
      } else {
        throw e;
      }
    }

    return NextResponse.json({ id: created.id, slug: finalSlug }, { status: 201 });
  } catch (err) {
    console.error("POST /api/recipes error:", err);
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/* ───────────────── GET (liste publique) ─────────────────
   → Public : seulement recipes non supprimées ET approuvées
   → Recherche portable : SANS `mode: "insensitive"` pour éviter l’erreur
*/
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = (searchParams.get("q") ?? "").trim();

    const pageParam = Number(searchParams.get("page") ?? "");
    const takeParam = Number(searchParams.get("take") ?? "");
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : NaN;
    const takeRaw = Number.isFinite(takeParam) && takeParam > 0 ? takeParam : NaN;
    const TAKE_MAX = 50;
    const take = Number.isFinite(takeRaw) ? Math.min(TAKE_MAX, Math.max(1, takeRaw)) : NaN;

    // Filtre public par défaut
    const whereBase = {
      deletedAt: null as Date | null,
      status: "APPROVED" as const,
    };

    // ⚠️ Pas de `mode: "insensitive"` pour rester compatible
    const where =
      q.length > 0
        ? {
            ...whereBase,
            OR: [
              { title: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : whereBase;

    // Pagination si page & take sont valides
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

    // Sinon, renvoyer la liste complète (non paginée)
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
    // Expose un message utile au client (ton HomeClient l’affiche)
    const msg = err instanceof Error ? err.message : "Erreur serveur";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
