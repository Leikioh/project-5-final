// backend/src/controllers/auth.controller.ts
import { Request, Response } from "express";
import prisma from "../prisma/client";
import { hash, compare } from "bcryptjs";
import { generateToken } from "../utils/jwt";
import { AuthRequest } from "../types/express";

/**
 * Enregistre un nouvel utilisateur (POST /api/auth/register).
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, name } = req.body as {
      email: string;
      password: string;
      name?: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "Email et mot de passe requis" });
      return;
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Cet email est déjà utilisé" });
      return;
    }

    const hashed = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashed,
        name: name || undefined,
      },
    });

    res.status(201).json({
      message: "Utilisateur créé",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
}

/**
 * Connexion d’un utilisateur (POST /api/auth/login).
 * Met le token dans un cookie sécurisé.
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body as {
      email: string;
      password: string;
    };

    if (!email || !password) {
      res.status(400).json({ error: "Email et mot de passe requis" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: "Identifiants invalides" });
      return;
    }

    const isValid = await compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Identifiants invalides" });
      return;
    }

    const token = generateToken(user.id);

    res
      .cookie("token", token, {
        httpOnly: true,
        secure: false,  // ← false en local sinon le cookie ne passe pas
        sameSite: "lax", // ou 'none' si tu utilises un autre domaine
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      })
      .status(200)
      .json({
        message: "Connecté avec succès",
        user: { id: user.id, email: user.email, name: user.name },
      });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ error: "Erreur interne" });
  }
}

/**
 * GET /api/auth/me — Renvoie les infos de l'utilisateur connecté.
 */
export async function me(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.userId;
  if (!userId) {
    res.status(401).json({ error: "Non authentifié" });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    res.status(404).json({ error: "Utilisateur introuvable" });
    return;
  }

  res.status(200).json(user);
}

/**
 * POST /api/auth/logout — Déconnecte l'utilisateur en supprimant le cookie.
 */
export async function logout(_req: Request, res: Response): Promise<void> {
  res
    .clearCookie("token", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    })
    .status(200)
    .json({ message: "Déconnecté avec succès" });
}
