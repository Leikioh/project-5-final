"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function SignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const resetForm = () => {
    setEmail("");
    setPassword("");
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ⬅️ nécessaire pour cookie
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        alert("Identifiants invalides");
        return;
      }

      await login(); // récupère l’utilisateur via /auth/me
      resetForm();
      router.push("/recipes");
    } catch (err) {
      console.error("Erreur de connexion :", err);
      alert("Erreur lors de la connexion. Veuillez réessayer.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="px-4 py-2 border rounded"
        required
      />
      <input
        type="password"
        placeholder="Mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="px-4 py-2 border rounded"
        required
      />
      <button type="submit" className="bg-orange-500 text-white py-2 rounded hover:bg-orange-600">
        Se connecter
      </button>
    </form>
  );
}
