import React from "react";
import Link from "next/link";
import Image from "next/image";

type ApiRecipe = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  author: { id: number; name: string | null; email: string };
  slug?: string | null;
  favoritesCount?: number;
  _count?: { favorites?: number; comments?: number };
};

type PagedResponse = {
  items: ApiRecipe[];
  total: number;
  page: number;
  pageCount: number;
};

function normalize(payload: unknown): ApiRecipe[] {
  if (Array.isArray(payload)) return payload as ApiRecipe[];
  if (payload && typeof payload === "object" && "items" in payload) {
    const p = payload as PagedResponse;
    return Array.isArray(p.items) ? p.items : [];
  }
  return [];
}

export default async function RecipesPage() {
  // On accepte NEXT_PUBLIC_API_URL, sinon on tombe sur le path relatif (en local comme en prod).
  const base = process.env.NEXT_PUBLIC_API_URL ?? "";
  const url = `${base}/api/recipes`;

  let recipes: ApiRecipe[] = [];
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      // petit fallback (évite que la page crashe si l’URL absolue est mal configurée)
      const res2 = await fetch("/api/recipes", { cache: "no-store" });
      if (!res2.ok) throw new Error("API error");
      recipes = normalize(await res2.json());
    } else {
      recipes = normalize(await res.json());
    }
  } catch {
    // en cas d’erreur réseau/API, on affiche quand même la page (vide)
    recipes = [];
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Toutes les recettes</h1>

      {recipes.length === 0 && (
        <p className="text-gray-500">Aucune recette disponible pour le moment.</p>
      )}

      {recipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {recipes.map((r) => {
            const favorites =
              (r._count?.favorites ?? r.favoritesCount ?? 0) as number;
            const authorName = r.author?.name ?? r.author?.email ?? "Anonyme";
            const slug = r.slug ?? String(r.id); // sécurité : si slug manquant (dev/seed ancien)

            return (
              <Link
                key={r.id}
                href={`/recipes/${slug}`}
                className="border text-gray-700 rounded-lg overflow-hidden hover:shadow-lg transition"
              >
                <div className="relative w-full h-48 bg-gray-100">
                  <Image
                    src={r.imageUrl ?? "/images/placeholder.jpg"}
                    alt={r.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 512px"
                    priority
                  />
                </div>

                <div className="p-4">
                  <h2 className="text-xl font-semibold">{r.title}</h2>
                  <p className="text-sm text-gray-600 mt-2">
                    Par {authorName} · {favorites} likes
                  </p>
                  {r.description && (
                    <p className="mt-2 text-gray-700 line-clamp-3">
                      {r.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
