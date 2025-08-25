import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";

export const runtime = "nodejs";

type LoginBody = { email?: string; password?: string };

export async function POST(req: Request) {
  let body: LoginBody;
  try {
    body = (await req.json()) as LoginBody;
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }
  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json({ error: "email et password requis" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });

  const ok = await compare(password, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "Identifiants invalides" }, { status: 401 });

  const c = await cookies();
  c.set("userId", String(user.id), {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
