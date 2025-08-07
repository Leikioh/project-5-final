// backend/src/utils/jwt.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "change_me"; 

interface JWTPayload {
  userId: number;
}

/**
 * Génère un token à partir d’un userId (plutôt que de passer tout un User).
 */
export function generateToken(userId: number): string {
  const payload: JWTPayload = { userId };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

/**
 * Vérifie et renvoie le payload du token.
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}
