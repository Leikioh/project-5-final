"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const resetForm = () => {
    setEmail("");
    setName("");
    setPassword("");
    setConfirm("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        alert("Identifiants incorrects");
        return;
      }

      await login(); // Récupère /me
      resetForm();
      router.push("/recipes");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la connexion");
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name }),
      });

      if (!res.ok) {
        alert("Impossible de créer le compte");
        return;
      }

      await login(); // Connecte automatiquement
      resetForm();
      router.push("/recipes");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l’inscription");
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT CARD */}
      <div className="w-1/2 flex justify-center items-center p-8">
        <div className="rounded-3xl p-10 w-full max-w-md shadow-lg">
          <motion.div
            key={isSignUp ? "signup" : "signin"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-3xl font-bold mb-6 text-orange-500 text-center">
              {isSignUp ? "Créer un compte" : "Connexion"}
            </h2>
            <form
              onSubmit={isSignUp ? handleSignup : handleLogin}
              className="flex flex-col gap-5"
            >
              {isSignUp && (
                <input
                  type="text"
                  placeholder="Nom d'utilisateur"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              )}
              <input
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              {isSignUp && (
                <input
                  type="password"
                  placeholder="Confirmer le mot de passe"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  required
                />
              )}
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-5 rounded-lg transition"
              >
                {isSignUp ? "S’inscrire" : "Se connecter"}
              </button>
            </form>
            <p className="mt-6 text-sm text-gray-600 text-center">
              {isSignUp ? (
                <>
                  Vous avez déjà un compte ?{" "}
                  <button
                    onClick={() => setIsSignUp(false)}
                    className="text-orange-500 hover:underline"
                  >
                    Connectez-vous
                  </button>
                </>
              ) : (
                <>
                  Pas encore de compte ?{" "}
                  <button
                    onClick={() => setIsSignUp(true)}
                    className="text-orange-500 hover:underline"
                  >
                    Inscrivez-vous
                  </button>
                </>
              )}
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
          {!isSignUp && (
            <motion.div
              className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white/90 to-white/50 p-12 rounded-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <p className="text-4xl font-semibold text-gray-600 mb-6 text-center">
                Nouveau ? <br /> Rejoins-nous et partage tes recettes.
              </p>
              <button
                onClick={() => setIsSignUp(true)}
                className="bg-white text-black shadow-lg px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
              >
                Créer un compte
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
