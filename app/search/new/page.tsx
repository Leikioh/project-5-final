// app/recipes/page.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";

export default async function RecipesPage() {
  // On fait un fetch côté serveur (Server Component) pour charger la liste initiale
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/recipes`, { cache: "no-store" });
  const recipes: Array<{
    id: number;
    title: string;
    description: string | null;
    imageUrl: string | null;
    createdAt: string;
    author: { id: number; name: string | null; email: string };
    favoritesCount: number;
  }> = await res.json();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Toutes les recettes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {recipes.map((r) => (
          <Link
            key={r.id}
            href={`/recipes/${r.id}`}
            className="border text-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition"
            >
            {r.imageUrl && (
                <div className="relative w-full h-48">
                    <Image
                        src={r.imageUrl}
                        alt={r.title}
                        fill
                        className="object-cover rounded"
                        priority
                    />
                </div>
            )}
            <div className="p-4">
              <h2 className="text-xl font-semibold">{r.title}</h2>
              <p className="text-sm text-gray-600 mt-2">
                Par {r.author.name ?? r.author.email} · {r.favoritesCount} likes
              </p>
              {r.description && (
                <p className="mt-2 text-gray-700 line-clamp-3">{r.description}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
