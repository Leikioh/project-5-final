// backend/src/controllers/like.controller.ts
import { Request, Response } from "express";
import prisma from "../prisma/client";
import { AuthRequest } from "../types/express";
import jwt from "jsonwebtoken";

/**
 * POST /api/likes
 * Permet de “liker” ou “unliker” une recette (nécessite un utilisateur authentifié).
 */
export async function toggleLike(
  req: AuthRequest,
  res: Response
): Promise<void> {
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

    // Vérifie l’existence
    const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
    if (!recipe) {
      res.status(404).json({ error: "Recette introuvable" });
      return;
    }

    // Toggle
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

    // Re-calcul du nombre TOTAL de likes
    const count = await prisma.favorite.count({ where: { recipeId } });
    const liked = !existing;

    // On renvoie l’état final
    res.status(200).json({ liked, count });
  } catch (err) {
    console.error("toggleLike error:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
}

/**
 * GET /api/likes/:recipeId
 * Renvoie le nombre de likes (favorites) pour une recette donnée.
 */
export async function getLikesCount(req: Request, res: Response): Promise<void> {
  const recipeId = Number(req.params.recipeId);
  if (isNaN(recipeId)) {
    res.status(400).json({ error: "ID invalide" });
    return;
  }

  const count = await prisma.favorite.count({ where: { recipeId } });

  // Décoder le token si présent pour renvoyer ajouté/déjà liké
  let liked = false;
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      const payload = jwt.verify(auth.slice(7), process.env.JWT_SECRET!) as {
        userId: number;
      };
      const exists = await prisma.favorite.findUnique({
        where: { userId_recipeId: { userId: payload.userId, recipeId } },
      });
      liked = !!exists;
    } catch {}
  }

  res.status(200).json({ count, liked });
}