"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      // 1) Création du compte
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!res.ok) {
        // on essaye de lire un message d’erreur côté API
        const payload: unknown = await res.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "Inscription impossible")
            : "Inscription impossible";
        throw new Error(message);
      }

      // 2) Connexion automatique
      const resLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!resLogin.ok) {
        const payload: unknown = await resLogin.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "Connexion automatique impossible")
            : "Connexion automatique impossible";
        throw new Error(message);
      }

      // 3) Redirection + refresh pour que le SSR voie le cookie
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l’inscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT CARD */}
      <div className="w-1/2 flex justify-center items-center p-8">
        <div className="rounded-3xl p-10 w-full max-w-md shadow-lg">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-orange-500 text-center">
              Créer un compte
            </h2>

            <form onSubmit={handleSignup} className="flex flex-col gap-5">
              <input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoComplete="email"
                required
              />

              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoComplete="new-password"
                required
              />

              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                className="px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoComplete="new-password"
                required
              />

              {error && <p className="text-sm text-red-600 -mt-2">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-5 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Création du compte..." : "S’inscrire"}
              </button>
            </form>

            <p className="mt-6 text-sm text-gray-600 text-center">
              Vous avez déjà un compte ?{" "}
              <button
                onClick={() => router.push("/auth/sign-in")}
                className="text-orange-500 hover:underline"
              >
                Connectez-vous
              </button>
            </p>
          </motion.div>
        </div>
      </div>

      {/* RIGHT CARD */}
      <div className="w-1/2 flex justify-center items-center p-8">
        <div className="relative bg-gray-900 rounded-3xl shadow-xl w-full h-full flex justify-center items-center overflow-hidden">
          <Image
            src="/images/signOut.jpg"
            alt="Cooking Illustration"
            fill
            className="object-cover rounded-3xl brightness-90"
            priority
          />
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white/90 to-white/50 p-12 rounded-2xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-4xl font-semibold text-gray-600 mb-6 text-center">
              Rejoins la communauté <br /> et partage tes meilleures recettes !
            </p>
            <button
              onClick={() => router.push("/auth/sign-in")}
              className="bg-white text-black shadow-lg px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 hover:text-white transition"
            >
              Déjà inscrit ? Connexion
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
