// backend/src/middlewares/auth.middleware.ts
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthRequest } from "../types/express";


type ReqWithCookies = AuthRequest & { cookies?: Record<string, string> };

export function ensureAuth(
  req: ReqWithCookies,
  res: Response,
  next: NextFunction
): void {
  // 1) Essaye d’abord le header Authorization: Bearer xxx
  const authHeader = req.headers.authorization;
  let token: string | undefined =
    authHeader && authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : undefined;

  // 2) Sinon, essaye le cookie "token"
  if (!token) {
    token = req.cookies?.token;
  }

  if (!token) {
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: "Invalid token" });
  }
}
