import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

function toInt(v: string | null): number | null {
  const n = v ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

async function getUserId(): Promise<number | null> {
  const store = await cookies();
  const raw = store.get("userId")?.value;
  const n = raw ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const recipeId = toInt(searchParams.get("recipeId"));
  if (!recipeId) {
    return NextResponse.json({ error: "recipeId requis" }, { status: 400 });
  }

  const page = Math.max(1, toInt(searchParams.get("page")) ?? 1);
  const take = Math.min(50, Math.max(1, toInt(searchParams.get("take")) ?? 10));
  const skip = (page - 1) * take;

  const [total, rows] = await Promise.all([
    prisma.comment.count({ where: { recipeId } }),
    prisma.comment.findMany({
      where: { recipeId },
      orderBy: { createdAt: "desc" },
      skip,
      take,
      include: {
        author: { select: { id: true, name: true } },
      },
    }),
  ]);

  const uid = await getUserId();
  let likedMap: Record<number, boolean> = {};
  if (uid && rows.length) {
    const likes = await prisma.commentLike.findMany({
      where: { userId: uid, commentId: { in: rows.map((r) => r.id) } },
      select: { commentId: true },
    });
    likedMap = Object.fromEntries(likes.map((l) => [l.commentId, true]));
  }

  const items = rows.map((r) => ({
    id: r.id,
    content: r.content,
    createdAt: r.createdAt,
    author: r.author ? { id: r.author.id, name: r.author.name } : null,
    likedByMe: Boolean(likedMap[r.id]),
  }));

  const pageCount = Math.max(1, Math.ceil(total / take));
  return NextResponse.json({ items, total, page, pageCount });
}

export async function POST(req: Request) {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { recipeId?: unknown; content?: unknown };
  try {
    body = (await req.json()) as { recipeId?: unknown; content?: unknown };
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const recipeId =
    typeof body.recipeId === "string" || typeof body.recipeId === "number"
      ? Number(body.recipeId)
      : NaN;
  const content = typeof body.content === "string" ? body.content.trim() : "";

  if (!Number.isFinite(recipeId) || recipeId <= 0) {
    return NextResponse.json({ error: "recipeId invalide" }, { status: 400 });
  }
  if (!content) {
    return NextResponse.json({ error: "Contenu requis" }, { status: 400 });
  }

  const exists = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!exists) return NextResponse.json({ error: "Recette introuvable" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { recipeId, content, authorId: userId },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}

export async function OPTIONS() {
  return NextResponse.json({ ok: true });
}
