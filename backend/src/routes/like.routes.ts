// backend/src/routes/like.routes.ts
import express from "express";
import { toggleLike, getLikesCount } from "../controllers/like.controller";
import { ensureAuth } from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/", ensureAuth, toggleLike);
router.get("/:recipeId", getLikesCount);

export default router;
