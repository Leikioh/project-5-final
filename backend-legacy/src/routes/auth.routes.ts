// src/routes/auth.routes.ts
import { Router } from "express";
import { register, login, me, logout } from "../controllers/auth.controller";
import { ensureAuth } from "../middlewares/auth.middleware";


const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", ensureAuth, me);
router.post("/logout", logout);

export default router;
