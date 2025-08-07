"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface Recipe {
  id: number;
  title: string;
  imageUrl: string;
}

export default function RecipesPage() {
  const router = useRouter();

  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [randomRecipe, setRandomRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger toutes les recettes au départ
  useEffect(() => {
    const loadRecipes = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recipes`);
        const data = await res.json();
        const list = Array.isArray(data.recipes) ? data.recipes : [];
        if (list.length === 0) {
          setError("Aucune recette disponible.");
          setLoading(false);
          return;
        }
        setRecipes(list);
        pickRandom(list);
      } catch (err) {
        console.error("❌ Error fetching recipes:", err);
        setError("Erreur de chargement des recettes.");
      } finally {
        setLoading(false);
      }
    };

    loadRecipes();
  }, []);

  // Choisir aléatoirement
  const pickRandom = (list: Recipe[]) => {
    const index = Math.floor(Math.random() * list.length);
    setRandomRecipe(list[index]);
  };

  const handleAnotherRecipe = () => {
    if (recipes.length > 0) {
      pickRandom(recipes);
    }
  };

  const handleViewRecipe = () => {
    if (randomRecipe) {
      router.push(`/recipes/${randomRecipe.id}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-orange-50 px-6 py-12">
      <h1 className="text-4xl font-bold mb-4 text-orange-600">🍳 Surprise Recipe!</h1>
      
      {loading && (
        <p className="text-gray-600 text-lg">Chargement d&apos;une recette surprise…</p>
      )}

      {error && (
        <p className="text-red-500 text-lg">{error}</p>
      )}

      {!loading && randomRecipe && (
        <div className="bg-white shadow-lg rounded-lg p-6 text-center max-w-md w-full">
         <Image
            src={randomRecipe.imageUrl}
            alt={randomRecipe.title}
            width={600}
            height={400}
            className="w-full h-60 object-cover rounded mb-4"
            />
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            {randomRecipe.title}
          </h2>

          <button
            onClick={handleViewRecipe}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg shadow hover:bg-orange-600 transition mb-3 w-full"
          >
            Voir cette recette
          </button>

          <button
            onClick={handleAnotherRecipe}
            className="border border-orange-500 text-orange-500 px-6 py-2 rounded-lg hover:bg-orange-50 transition w-full"
          >
            Une autre recette ?
          </button>
        </div>
      )}
    </div>
  );
}
