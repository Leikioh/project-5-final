import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  const raw = store.get("userId")?.value;
  const id = raw ? Number(raw) : NaN;
  if (!Number.isFinite(id)) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, name: true },
  });

  return NextResponse.json({ user: user ?? null }, { status: 200 });
}
