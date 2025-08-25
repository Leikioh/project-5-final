// backend/src/routes/like.routes.ts
import express from "express";
import { toggleLike, getLikesCount } from "../controllers/like.controller";
import { ensureAuth } from "../middlewares/auth.middleware";

const router = express.Router();

// POST /api/likes  (body: { recipeId })
router.post("/", ensureAuth, toggleLike);

// GET /api/likes/:recipeId  (public, mais on détecte si l’utilisateur a liké via cookie)
router.get("/:recipeId", getLikesCount);

export default router;