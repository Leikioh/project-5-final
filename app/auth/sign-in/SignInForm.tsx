"use client";

import React, { JSX, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function SignInForm(): JSX.Element {
  const [name, setName] = useState<string>(""); // <-- nouveau (optionnel)
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
          password, // le backend n'utilise pas `name` pour la connexion — c'est purement UI ici
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
      router.push("/recipes");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur lors de la connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Champ optionnel pour rester cohérent avec ta page sign-in */}
      <input
        type="text"
        placeholder="Nom d'utilisateur (optionnel)"
        value={name}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
        className="px-4 py-2 border rounded text-black"
        autoComplete="username"
      />

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
        className="px-4 py-2 border rounded text-black"
        autoComplete="email"
        required
      />

      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
        className="px-4 py-2 border rounded text-black"
        autoComplete="current-password"
        required
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="bg-orange-500 text-white py-2 rounded hover:bg-orange-600 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? "Connexion..." : "Se connecter"}
      </button>
    </form>
  );
}
