// backend/src/types/express.d.ts
import { Request } from "express";

export interface AuthRequest extends Request {
  userId?: number;
}
