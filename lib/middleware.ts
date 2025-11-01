import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminArea = pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (!isAdminArea) return NextResponse.next();

  const userId = req.cookies.get("userId")?.value;
  if (!userId) return NextResponse.redirect(new URL("/auth/sign-in", req.url));

  // On ne peut pas requêter Prisma ici. On fait une vérif côté API aussi (double check).
  // Option : stocker un cookie "role=ADMIN" signé si tu veux filtrer ici.
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
