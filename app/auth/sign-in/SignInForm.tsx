"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

type SignInFormProps = {
  onSuccessRedirect?: string;
  showNameField?: boolean;
};

export default function SignInForm({
  onSuccessRedirect = "/recipes",
  showNameField = true,
}: SignInFormProps) {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const { login } = useAuth();
  const router = useRouter();

  const resetForm = (): void => {
    setName("");
    setEmail("");
    setPassword("");
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (!res.ok) {
        const payload: unknown = await res.json().catch(() => null);
        const message =
          payload && typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error?: unknown }).error ?? "Identifiants invalides")
            : "Identifiants invalides";
        throw new Error(message);
      }

      await login();
      resetForm();
      router.push(onSuccessRedirect);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm sm:max-w-md mx-auto">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow p-4 sm:p-6 flex flex-col gap-4"
      >
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 text-center">
          Connexion
        </h2>

        {showNameField && (
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
        )}

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
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
      </form>
    </div>
  );
}
