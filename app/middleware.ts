// middleware.ts (racine)
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const isAdmin = req.cookies.get("role")?.value === "ADMIN"; // ou un JWT, ou session server-side
  const isAdminPath = req.nextUrl.pathname.startsWith("/admin");

  if (isAdminPath && !isAdmin) {
    const loginUrl = new URL("/auth/sign-in", req.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
