import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

// Prisma + Next API → Node runtime (pas Edge)
export const runtime = "nodejs";

// Schéma d'entrée strict
const QuerySchema = z.object({
  q: z.string().trim().min(1, "query vide").max(100, "query trop longue"),
});

// BigInt → JSON safe
function jsonSafe(data: unknown): NextResponse {
  const safe = JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? Number(v) : v))
  );
  return NextResponse.json(safe);
}

// Simule/branche ton guard d’admin (retourne bool ou lève une Error codée)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function assertAdmin(_req: NextRequest): Promise<void> {
  
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    await assertAdmin(request);

    const url = new URL(request.url);
    const qRaw = url.searchParams.get("q") ?? "";
    const parsed = QuerySchema.safeParse({ q: qRaw });
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const q = parsed.data.q;

    const results = await prisma.recipe.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { slug: { contains: q } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: {
        id: true,
        title: true,
        slug: true,
        updatedAt: true,
      },
    });

    return jsonSafe({ ok: true, count: results.length, results });
  } catch (err: unknown) {
    
    if (err instanceof Error && err.name === "UNAUTHORIZED") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    
    
    console.error("ADMIN_SEARCH_ERROR", err);

    const message =
      err instanceof Error ? err.message : "unexpected_error";

    return NextResponse.json(
      { error: "internal_error", detail: message },
      { status: 500 }
    );
  }
}
