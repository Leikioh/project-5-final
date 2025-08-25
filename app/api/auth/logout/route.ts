import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST() {
  const c = await cookies();
  c.set("userId", "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}
