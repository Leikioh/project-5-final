import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  const c = await cookies();
  const raw = c.get("userId")?.value;
  const userId = raw ? Number(raw) : NaN;
  if (!Number.isFinite(userId)) return NextResponse.json({ authenticated: false }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true }
  });
  if (!user) return NextResponse.json({ authenticated: false }, { status: 401 });

  return NextResponse.json({ authenticated: true, user });
}
