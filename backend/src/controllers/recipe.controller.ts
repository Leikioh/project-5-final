// backend/src/controllers/recipe.controller.ts

import { Request, Response } from "express";
import prisma from "../prisma";
import { AuthRequest } from "../types/express";

/**
 * GET /api/recipes
 * Récupère toutes les recettes, en incluant l’auteur et le nombre de favoris.
 */
export async function getAllRecipes(req: Request, res: Response): Promise<void> {
  try {
    const recipes = await prisma.recipe.findMany({
      include: {
        author: {
          select: { id: true, name: true, email: true }
        },
        favorites: {
          select: { userId: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    // On transforme les résultats
    const mapped = recipes.map((r) => ({
      id: r.id,
      title: r.title,
      imageUrl: r.imageUrl ?? "",
      rating: "5.0",  // Valeur par défaut pour l'affichage
      author: {
        id: r.author.id,
        name: r.author.name ?? "Anonyme",
      },
    }));

    // On retourne un objet, pas un tableau direct
    res.status(200).json({
      recipes: mapped,
      page: 1,
      totalPages: 1
    });
  } catch (err) {
    console.error("getAllRecipes error:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
}

/**
 * POST /api/recipes
 * Crée une nouvelle recette. Nécessite un utilisateur authentifié (req.user est défini).
 */
export async function createRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    // On définit explicitement le type attendu dans req.body
    const payload = req.body as {
      title: string;
      description?: string;
      imageUrl?: string;
    };

    const title = payload.title?.trim();
    // description et imageUrl sont optionnels
    const description = payload.description?.trim() || undefined;
    const imageUrl = payload.imageUrl?.trim() || undefined;

    if (!title) {
      res.status(400).json({ error: "Le titre est requis" });
      return;
    }

    // req.user est défini par ensureAuth
     const userId = req.userId;
      if (!userId) {
      res.status(401).json({ error: "Non authentifié" });
      return;
    }

    const recipe = await prisma.recipe.create({
      data: {
        title,
        description,
        imageUrl,
        author: { connect: { id: userId } }
      },
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        createdAt: true,
        author: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(recipe);
    return;
  } catch (err) {
    console.error("createRecipe error:", err);
    res.status(500).json({ error: "Erreur interne" });
    return;
  }
}

/**
 * GET /api/recipes/:id
 * Récupère une recette en fonction de son ID, avec auteur et liste des favoris.
 */
export async function getRecipeById(req: Request, res: Response): Promise<void> {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Identifiant invalide" });
      return;
    }

    const recipe = await prisma.recipe.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, name: true } },
        steps: true,
        ingredients: true,
        comments: true,
        favorites: true,
      },
    });

    if (!recipe) {
      res.status(404).json({ error: "Recette introuvable" });
      return;
    }

    res.status(200).json({
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      imageUrl: recipe.imageUrl,
      createdAt: recipe.createdAt,
      author: recipe.author,
      favoritesCount: recipe.favorites.length,
      steps: recipe.steps ?? [],
      ingredients: recipe.ingredients ?? [],
      comments: recipe.comments ?? [],
      activeTime: recipe.activeTime,
      totalTime: recipe.totalTime,
      yield: recipe.yield,
    });
  } catch (err) {
    console.error("getRecipeById error:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
}

/**
 * POST /api/recipes/:id/comments
 * Ajoute un commentaire à une recette
 */
export async function addCommentToRecipe(req: AuthRequest, res: Response): Promise<void> {
  try {
    const recipeId = Number(req.params.id);
    if (Number.isNaN(recipeId)) {
      res.status(400).json({ error: "Identifiant de recette invalide" });
      return;
    }

    const { content } = req.body;
    const userId = req.userId;

    if (!content || !userId) {
      res.status(400).json({ error: "Contenu requis et utilisateur non authentifié" });
      return;
    }

    await prisma.comment.create({
      data: {
        content,
        author: { connect: { id: userId } },
        recipe: { connect: { id: recipeId } },
      },
    });

    const updatedRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        author: { select: { id: true, name: true } },
        steps: true,
        ingredients: true,
        favorites: true,
        comments: {
          include: {
            author: { select: { name: true } }, // ← pour afficher le nom du commentateur
          },
        },
      },
    });

    if (!updatedRecipe) {
      res.status(404).json({ error: "Recette introuvable" });
      return;
    }

    res.status(200).json({
      ...updatedRecipe,
      favoritesCount: updatedRecipe.favorites.length,
    });
  } catch (err: unknown) {
  if (err instanceof Error) {
    console.error("addCommentToRecipe error:", err.message);
    res.status(500).json({ error: "Erreur interne", detail: err.message });
  } else {
    console.error("addCommentToRecipe unknown error:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
  }
}