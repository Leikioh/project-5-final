"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaSearch } from "react-icons/fa";
import LikeButton from "@/components/LikeButton";

interface Recipe {
  id: number;
  title: string;
  imageUrl: string;
  rating: string;
  author: { id: number; name: string | null };
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filtered, setFiltered] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);

  // ✅ 1) Chargement initial
  useEffect(() => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recipes`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        console.log("✅ /SEARCH API DATA:", data);
        const list = Array.isArray(data.recipes) ? data.recipes : [];
        setRecipes(list);
        setFiltered(list);
      })
      .catch((err) => {
        console.error("❌ Erreur fetch:", err);
        setRecipes([]);
        setFiltered([]);
      })
      .finally(() => setLoading(false));
  }, []);

  // ✅ 2) Filtrage en local
  useEffect(() => {
    const q = query.trim().toLowerCase();
    setFiltered(
      q === ""
        ? recipes
        : recipes.filter((r) =>
            r.title.toLowerCase().includes(q)
          )
    );
  }, [query, recipes]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
  <div className="text-center mb-10 mt-20">
    <h1 className="text-4xl font-bold text-gray-800">Search Recipes</h1>
    <p className="text-gray-500 mt-2">Find your next favorite meal</p>
  </div>

  {/* SearchBar */}
  <div className="max-w-5xl mx-auto px-4 mb-12">
    <div className="bg-[#fef7f7] border border-gray-200 rounded-lg flex items-center px-4 py-3 shadow-sm">
      <FaSearch className="text-gray-400 mr-3" />
      <input
        type="text"
        placeholder="Search for recipes..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-500"
      />
    </div>
  </div>

  {/* Results grid */}
  {loading ? (
    <p className="text-center text-gray-500">Loading...</p>
  ) : filtered.length === 0 ? (
    <p className="text-center text-gray-500">
      {query ? `No results for “${query}”.` : "No recipes available."}
    </p>
  ) : (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((r) => (
        <div
          key={r.id}
          className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden flex flex-col"
        >
          <div className="relative h-48">
            <Link
              href={`/recipes/${r.id}`}
              className="absolute inset-0 z-10"
            >
              <Image
                src={r.imageUrl}
                alt={r.title}
                fill
                className="object-cover"
              />
            </Link>

            <LikeButton
              recipeId={r.id}
              className="absolute top-2 right-2 z-20"
            />
          </div>

          <div className="p-4 flex-1 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                {r.title}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                by {r.author?.name ?? "Anonyme"}
              </p>
              <p className="mt-2 text-orange-500 font-medium">
                ⭐ {r.rating}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )}
</main>
  );
}
