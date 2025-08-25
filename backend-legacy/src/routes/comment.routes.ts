import express from "express";
import {
  getCommentsByRecipe,
  addComment,
  deleteComment,
  toggleCommentLike,
  getCommentLikeCount,
} from "../controllers/comment.controller";
import { ensureAuth } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/:recipeId", getCommentsByRecipe);
router.post("/", ensureAuth, addComment);
router.delete("/:commentId", ensureAuth, deleteComment);
router.post("/:commentId/likes", ensureAuth, toggleCommentLike);
router.get("/:commentId/likes", getCommentLikeCount);

export default router;
