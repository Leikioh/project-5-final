// backend/src/routes/recipe.routes.ts
import { Router } from "express";
import {
  getAllRecipes,
  createRecipe,
  getRecipeById,
  addCommentToRecipe,
} from "../controllers/recipe.controller";
import { ensureAuth } from "../middlewares/auth.middleware";

const router = Router();

router.get("/", getAllRecipes);
router.post("/", ensureAuth, createRecipe);
router.get("/:id", getRecipeById);
router.post("/:id/comments", ensureAuth, addCommentToRecipe);

export default router;
