// backend/src/controllers/comment.controller.ts
import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/express";
import prisma from "../prisma/client";

// GET /api/comments/:recipeId
export async function getCommentsByRecipe(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const recipeId = Number(req.params.recipeId);
    if (isNaN(recipeId)) {
      res.status(400).json({ message: "Invalid recipe ID" });
      return;
    }
    const comments = await prisma.comment.findMany({
      where: { recipeId },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(comments);
  } catch (err) {
    next(err);
  }
}

// POST /api/comments
export async function addComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const { recipeId, content } = req.body as {
      recipeId: number;
      content: string;
    };
    const comment = await prisma.comment.create({
      data: {
        content,
        recipe: { connect: { id: recipeId } },
        author: { connect: { id: userId } },
      },
      include: {
        author: { select: { id: true, name: true, email: true } },
      },
    });
    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/comments/:commentId
export async function deleteComment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const commentId = Number(req.params.commentId);
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true },
    });
    if (!existing) {
      res.status(404).json({ message: "Comment not found" });
      return;
    }
    if (existing.authorId !== userId) {
      res.status(403).json({ message: "Forbidden" });
      return;
    }
    await prisma.comment.delete({ where: { id: commentId } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// POST /api/comments/:commentId/likes
export async function toggleCommentLike(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.userId;
    const commentId = Number(req.params.commentId);
    if (!userId) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }
    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
    });
    if (existing) {
      await prisma.commentLike.delete({
        where: { userId_commentId: { userId, commentId } },
      });
    } else {
      await prisma.commentLike.create({
        data: { userId, commentId },
      });
    }
    const count = await prisma.commentLike.count({ where: { commentId } });
    res.json({ liked: !existing, count });
  } catch (err) {
    next(err);
  }
}

// GET /api/comments/:commentId/likes
export async function getCommentLikeCount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const commentId = Number(req.params.commentId);
    const count = await prisma.commentLike.count({ where: { commentId } });
    res.json({ count });
  } catch (err) {
    next(err);
  }
}
