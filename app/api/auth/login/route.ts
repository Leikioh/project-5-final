import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";

export const runtime = "nodejs";

type LoginBody = { email?: string; password?: string };

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}

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

  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 401 });
  }

  if (!user.passwordHash || user.passwordHash.length < 20) {
  
    return NextResponse.json({ error: "Compte invalide (pas de mot de passe défini)" }, { status: 401 });
  }

  const ok = await compare(password, user.passwordHash).catch(() => false);
  if (!ok) {
    
    return NextResponse.json({ error: "Mot de passe incorrect" }, { status: 401 });
  }


  const c = await cookies();
  c.set("userId", String(user.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 jours
  });

  return NextResponse.json({ id: user.id, name: user.name, email: user.email });
}
