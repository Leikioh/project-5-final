"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const RegisterPage: React.FC = () => {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || null,
        }),
      });

      if (!res.ok) {
        const payload: unknown = await res.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "Inscription impossible")
            : "Inscription impossible";
        throw new Error(message);
      }
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

      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de l’inscription");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10 items-stretch">
          <div className="relative h-56 xs:h-64 sm:h-72 md:h-auto rounded-3xl overflow-hidden order-1 md:order-none">
            <Image
              src="/images/signOut.jpg"
              alt="Cooking Illustration"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white/90 to-white/50 p-6 sm:p-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-2xl sm:text-3xl md:text-4xl font-semibold text-gray-700 mb-4 sm:mb-6 text-center">
                Rejoins la communauté <br className="hidden sm:block" /> et partage tes meilleures recettes !
              </p>
              <button
                onClick={() => router.push("/auth/sign-in")}
                className="bg-white text-black shadow px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-semibold hover:bg-orange-600 hover:text-white transition"
              >
                Déjà inscrit ? Connexion
              </button>
            </motion.div>
          </div>

          <div className="w-full max-w-md md:max-w-lg mx-auto flex items-center">
            <div className="w-full bg-white rounded-2xl shadow p-5 sm:p-7">
              <motion.h2
                className="text-2xl sm:text-3xl font-bold mb-6 text-orange-500 text-center"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4 }}
              >
                Créer un compte
              </motion.h2>

              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="username" className="sr-only">
                    Nom d&apos;utilisateur (optionnel)
                  </label>
                  <input
                    id="username"
                    type="text"
                    placeholder="Nom d'utilisateur (optionnel)"
                    value={name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="sr-only">
                    Adresse email
                  </label>
                  <input
                    id="email"
                    type="email"
                    placeholder="Adresse email"
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">
                    Mot de passe
                  </label>
                  <input
                    id="password"
                    type="password"
                    placeholder="Mot de passe"
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    autoComplete="new-password"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="confirm" className="sr-only">
                    Confirmer le mot de passe
                  </label>
                  <input
                    id="confirm"
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    autoComplete="new-password"
                    required
                  />
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-600 -mt-1">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
