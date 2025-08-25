import { Request, Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../types/express";
import jwt from "jsonwebtoken";

/**
 * POST /api/likes
 * Body: { recipeId: number }
 * Toggle like (auth requise via cookie)
 */
export async function toggleLike(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ error: "Non authentifié" });
      return;
    }

    const { recipeId } = req.body as { recipeId: number };
    if (!recipeId) {
      res.status(400).json({ error: "recipeId requis" });
      return;
    }

    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      res.status(404).json({ error: "Recette introuvable" });
      return;
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_recipeId: { userId, recipeId } },
    });

    if (existing) {
      await prisma.favorite.delete({
        where: { userId_recipeId: { userId, recipeId } },
      });
    } else {
      await prisma.favorite.create({
        data: { userId, recipeId },
      });
    }

    const count = await prisma.favorite.count({ where: { recipeId } });
    const liked = !existing;

    res.status(200).json({ liked, count });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
}

/**
 * GET /api/likes/:recipeId
 * Public. Renvoie { count, liked } ; "liked" détecté via cookie si présent.
 */
export async function getLikesCount(
  req: Request & { cookies: Record<string, string> },
  res: Response
): Promise<void> {
  const recipeId = Number(req.params.recipeId);
  if (isNaN(recipeId)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const count = await prisma.favorite.count({ where: { recipeId } });

  let liked = false;

  // Lecture du cookie JWT (si présent)
  const tokenCookie = req.cookies?.token;
  // Lecture du header Authorization (si présent)
  const auth = req.headers.authorization;
  const token =
    tokenCookie ||
    (auth?.startsWith("Bearer ") ? auth.slice(7) : undefined);

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: number;
      };
      const exists = await prisma.favorite.findUnique({
        where: { userId_recipeId: { userId: payload.userId, recipeId } },
      });
      liked = !!exists;
    } catch {
      // token invalide → liked = false
    }
  }

  res.status(200).json({ count, liked });
}