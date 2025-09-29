"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirm, setConfirm] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const router = useRouter();

  const resetForm = (): void => {
    setEmail("");
    setName("");
    setPassword("");
    setConfirm("");
  };

  async function handleLogin(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    if (!email || !password) return;

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!res.ok) {
        const payload: unknown = await res.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "Identifiants incorrects")
            : "Identifiants incorrects";
        throw new Error(message);
      }

      await login();
      resetForm();
      router.push("/recipes");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la connexion");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
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
          name: name || null,
        }),
      });
      if (!res.ok) {
        const payload: unknown = await res.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "Impossible de créer le compte")
            : "Impossible de créer le compte";
        throw new Error(message);
      }

      const resLogin = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      if (!resLogin.ok) {
        const payload: unknown = await resLogin.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "Connexion automatique impossible")
            : "Connexion automatique impossible";
        throw new Error(message);
      }

      await login();
      resetForm();
      router.push("/recipes");
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
          <div className="w-full max-w-md md:max-w-lg mx-auto flex items-center">
            <div className="w-full bg-white rounded-2xl shadow p-6 sm:p-8">
              <motion.div
                key={isSignUp ? "signup" : "signin"}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-orange-500 text-center">
                  {isSignUp ? "Créer un compte" : "Connexion"}
                </h2>

                <form onSubmit={isSignUp ? handleSignup : handleLogin} className="flex flex-col gap-4">
                  {isSignUp && (
                    <div>
                      <label htmlFor="username" className="sr-only">Nom d&apos;utilisateur</label>
                      <input
                        id="username"
                        type="text"
                        placeholder="Nom d'utilisateur"
                        value={name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoComplete="username"
                      />
                    </div>
                  )}

                  <div>
                    <label htmlFor="email" className="sr-only">Adresse email</label>
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
                    <label htmlFor="password" className="sr-only">Mot de passe</label>
                    <input
                      id="password"
                      type="password"
                      placeholder="Mot de passe"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      autoComplete={isSignUp ? "new-password" : "current-password"}
                      required
                    />
                  </div>

                  {isSignUp && (
                    <div>
                      <label htmlFor="confirm" className="sr-only">Confirmer le mot de passe</label>
                      <input
                        id="confirm"
                        type="password"
                        placeholder="Confirmer le mot de passe"
                        value={confirm}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirm(e.target.value)}
                        className="w-full px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  )}

                  {error && <p className="text-sm text-red-600 -mt-1">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? isSignUp
                        ? "Création du compte..."
                        : "Connexion..."
                      : isSignUp
                        ? "S’inscrire"
                        : "Se connecter"}
                  </button>
                </form>

                <p className="mt-6 text-sm text-gray-600 text-center">
                  {isSignUp ? (
                    <>
                      Vous avez déjà un compte ?{" "}
                      <button onClick={() => setIsSignUp(false)} className="text-orange-500 hover:underline">
                        Connectez-vous
                      </button>
                    </>
                  ) : (
                    <>
                      Pas encore de compte ?{" "}
                      <button onClick={() => setIsSignUp(true)} className="text-orange-500 hover:underline">
                        Inscrivez-vous
                      </button>
                    </>
                  )}
                </p>
              </motion.div>
            </div>
          </div>

          <div className="relative h-56 xs:h-64 sm:h-72 md:h-auto rounded-3xl overflow-hidden">
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
              {isSignUp ? (
                <>
                  <p className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-4 sm:mb-6 text-center">
                    Déjà inscrit ?
                  </p>
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="bg-white text-black shadow px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-semibold hover:bg-orange-600 hover:text-white transition"
                  >
                    Se connecter
                  </button>
                </>
              ) : (
                <>
                  <p className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-4 sm:mb-6 text-center">
                    Nouveau ? <br className="hidden sm:block" /> Rejoins-nous et partage tes recettes.
                  </p>
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="bg-white text-black shadow px-6 py-2.5 sm:px-8 sm:py-3 rounded-xl font-semibold hover:bg-orange-600 hover:text-white transition"
                  >
                    Créer un compte
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
