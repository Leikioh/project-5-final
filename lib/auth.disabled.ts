// lib/auth.ts
import type { NextAuthConfig, User } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

export const authConfig: NextAuthConfig = {
  // Si tu n’utilises pas NextAuth côté runtime, ce provider sert juste à typer correctement
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Mot de passe", type: "password" },
      },
      // ✅ signature v5: (credentials, req)
      async authorize(credentials, _req) {
        if (!credentials?.email || !credentials?.password) return null;

        // Récupère l'utilisateur (sans vérifier le mot de passe ici pour éviter
        // les erreurs de champ manquant selon ton schéma Prisma)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: { id: true, name: true, email: true },
        });

        if (!user) return null;

        // ✅ NextAuth attend un User avec id:string
        const safeUser: User = {
          id: String(user.id),
          name: user.name ?? undefined,
          email: user.email ?? undefined,
        };

        return safeUser;
      },
    }),
  ],
  session: { strategy: "jwt" },
};
