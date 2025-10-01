"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import { apiPath } from "@/lib/api";

type Author = { id: number; name: string | null };
type Recipe = {
  id: number;
  title: string;
  imageUrl: string | null;
  author: Author;
  slug: string;
};

type PagedResponse = {
  items: Recipe[];
  total: number;
  page: number;
  pageCount: number;
};
type RecipesResponse = PagedResponse | Recipe[];

const pickRandom = (arr: Recipe[]): Recipe | null =>
  arr.length ? arr[Math.floor(Math.random() * arr.length)] : null;

export default function RecipesRandomizerPage(): React.JSX.Element {
  const [recipe, setRecipe] = React.useState<Recipe | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadRandom = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Endpoint dédié si présent
      const r1 = await fetch(apiPath("/api/recipes/random"), {
        cache: "no-store",
        credentials: "include",
      });

      if (r1.ok) {
        const one = (await r1.json()) as Recipe | null;
        setRecipe(one ?? null);
        return;
      }

      // Fallback: on prend une recette au hasard depuis la liste
      const r2 = await fetch(apiPath("/api/recipes"), { cache: "no-store" });
      if (!r2.ok) {
        setRecipe(null);
        setError("Impossible de charger une recette.");
        return;
      }
      const data: RecipesResponse = await r2.json();
      const list = Array.isArray(data) ? data : data.items;
      setRecipe(pickRandom(list));
    } catch {
      setRecipe(null);
      setError("Erreur réseau.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadRandom();
  }, [loadRandom]);

  return (
    <div className="min-h-screen bg-orange-50">
      <main className="max-w-6xl mx-auto px-6 pt-24 pb-16">
        {loading && (
          <div className="mx-auto max-w-md w-full animate-pulse">
            <div className="h-60 w-full rounded bg-gray-200 mb-4" />
            <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
          </div>
        )}

        {error && !loading && <p className="text-red-500">{error}</p>}

        {!loading && !error && !recipe && (
          <p className="text-gray-500">Aucune recette trouvée.</p>
        )}

        {!loading && !error && recipe && (
          <div className="bg-white shadow-lg rounded-lg p-6 text-center max-w-md w-full mx-auto">
            <div className="relative w-full h-60 mb-4 rounded overflow-hidden">
              <Image
                src={recipe.imageUrl ?? "/images/placeholder.jpg"}
                alt={recipe.title}
                fill
                className="object-cover"
                sizes="(max-width:768px) 100vw, 600px"
                priority
              />

              {/* IMPORTANT: on passe le slug au LikeButton */}
              <LikeButton recipeSlug={recipe.slug} className="absolute top-2 right-2" />
            </div>

            <h2 className="text-2xl font-semibold mb-2 text-gray-800">
              {recipe.title}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              by {recipe.author?.name ?? "Anonyme"}
            </p>

            <Link
              href={`/recipes/${recipe.slug}`}
              className="block bg-orange-500 text-white px-6 py-2 rounded-lg shadow hover:bg-orange-600 transition mb-3 w-full"
            >
              Voir cette recette
            </Link>

            <button
              onClick={() => void loadRandom()}
              className="w-full border border-orange-500 text-orange-500 px-6 py-2 rounded-lg hover:bg-orange-50 transition"
            >
              Une autre recette
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
