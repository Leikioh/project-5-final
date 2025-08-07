"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";

const RegisterPage: React.FC = () => {
  const [email, setEmail]           = useState("");
  const [password, setPassword]     = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const router                      = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Impossible de créer le compte");
        return;
      }
      alert("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      router.push("/auth/sign-in");
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
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirm(e.target.value)}
                className="px-4 py-3 rounded-lg border text-black border-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-5 rounded-lg transition"
              >
                S’inscrire
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
              className="bg-white text-black shadow-lg px-8 py-3 rounded-xl font-semibold hover:bg-orange-600 transition"
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
