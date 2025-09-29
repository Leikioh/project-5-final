"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaClock, FaUtensils } from "react-icons/fa";
import Footer from "@/components/Footer";
import { apiPath } from "@/lib/api";
import CommentsPanel from "@/components/CommentsPanel";

type Step = { id: number; text: string };
type Ingredient = { id: number; name: string };
type Author = { id: number; name: string | null };

type RecipeAPI = {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string | null;
  author: Author;
  steps: Step[];
  ingredients: Ingredient[];
  activeTime: string | null;
  totalTime: string | null;
  yield: string | null;
  _count?: { favorites: number; comments: number };
};

function RandomRecipes({ currentId }: { currentId: number }): JSX.Element | null {
  type ListItem = {
    id: number;
    title: string;
    imageUrl: string | null;
    author: { id: number; name: string | null };
  };

  const [all, setAll] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const res = await fetch(apiPath("/api/recipes"), {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          if (mounted) setAll([]);
          return;
        }
        const data = (await res.json()) as unknown;

        const list: ListItem[] = Array.isArray(data)
          ? data
              .map((r) => {
                const rec = r as Partial<ListItem>;
                return {
                  id: typeof rec.id === "number" ? rec.id : NaN,
                  title: typeof rec.title === "string" ? rec.title : "",
                  imageUrl: typeof rec.imageUrl === "string" ? rec.imageUrl : null,
                  author:
                    rec.author && typeof rec.author === "object"
                      ? {
                          id:
                            typeof (rec.author as { id?: number }).id === "number"
                              ? (rec.author as { id?: number }).id!
                              : NaN,
                          name:
                            typeof (rec.author as { name?: string | null }).name === "string" ||
                            (rec.author as { name?: string | null }).name === null
                              ? ((rec.author as { name?: string | null }).name ?? null)
                              : null,
                        }
                      : { id: NaN, name: null },
                };
              })
              .filter((x) => Number.isFinite(x.id) && x.title.length > 0)
          : [];

        if (mounted) setAll(list);
      } catch {
        if (mounted) setAll([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const picks = useMemo(() => {
    const pool = all.filter((r) => r.id !== currentId).slice();
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 4);
  }, [all, currentId]);

  if (loading || picks.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Recettes similaires</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {picks.map((r) => (
          <Link key={r.id} href={`/recipes/${r.id}`} className="block group">
            <div className="bg-white rounded-lg h-[260px] shadow hover:shadow-lg transition overflow-hidden">
              <div className="relative h-40">
                <Image
                  src={r.imageUrl ?? "/images/placeholder.jpg"}
                  alt={r.title}
                  fill
                  className="object-cover group-hover:scale-[1.02] transition"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-500 mb-1">{r.author?.name ?? "Anonyme"}</p>
                <h3 className="text-base font-semibold text-gray-800 line-clamp-2">{r.title}</h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function RecipeDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);
  const [recipe, setRecipe] = useState<RecipeAPI | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!Number.isFinite(recipeId)) return;

    let mounted = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        const res = await fetch(apiPath(`/api/recipes/${recipeId}`), {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          if (mounted) setRecipe(null);
          return;
        }
        const data = (await res.json()) as Partial<RecipeAPI>;
        if (
          data &&
          typeof data.id === "number" &&
          typeof data.title === "string"
        ) {
          if (mounted) {
            setRecipe({
              id: data.id,
              title: data.title,
              description: (data.description ?? null) as string | null,
              imageUrl: (data.imageUrl ?? null) as string | null,
              author: (data.author ?? { id: NaN, name: null }) as Author,
              steps: Array.isArray(data.steps) ? (data.steps as Step[]) : [],
              ingredients: Array.isArray(data.ingredients)
                ? (data.ingredients as Ingredient[])
                : [],
              activeTime: (data.activeTime ?? null) as string | null,
              totalTime: (data.totalTime ?? null) as string | null,
              yield: (data.yield ?? null) as string | null,
              _count: (data._count ?? undefined) as RecipeAPI["_count"],
            });
          }
        } else if (mounted) {
          setRecipe(null);
        }
      } catch {
        if (mounted) setRecipe(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [recipeId]);

  if (loading) return <p className="text-center py-10">Chargement...</p>;
  if (!recipe) return <p className="text-center py-10 text-red-500">Recette introuvable.</p>;

  const favoritesCount = recipe._count?.favorites ?? 0;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-8 shadow-lg">
        <Image
          src={recipe.imageUrl ?? "/images/placeholder.jpg"}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1280px) 80vw, 960px"
        />
      </div>

      <h1 className="text-4xl font-bold mb-2 text-gray-900">{recipe.title}</h1>
      <p className="text-gray-600 mb-6">
        by{" "}
        {recipe.author?.id ? (
          <Link href={`/users/${recipe.author.id}`} className="text-orange-600 hover:underline">
            {recipe.author?.name ?? "Anonyme"}
          </Link>
        ) : (
          recipe.author?.name ?? "Anonyme"
        )}
      </p>

      {recipe.description && <p className="text-lg text-gray-800 mb-8">{recipe.description}</p>}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
        <div className="md:col-span-3">
          <div className="flex flex-wrap gap-6 my-4">
            <div className="flex items-center gap-2">
              <FaClock className="text-orange-500" />
              <span className="text-gray-700">{recipe.activeTime ?? "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="text-orange-500" />
              <span className="text-gray-700">{recipe.totalTime ?? "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaUtensils className="text-orange-500" />
              <span className="text-gray-700">{recipe.yield ?? "-"}</span>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded shadow text-center">
          <p className="text-orange-500 text-sm font-bold">Favorites</p>
          <p className="text-lg font-semibold text-gray-800">{favoritesCount}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <section className="flex-1">
          <h2 className="text-2xl text-gray-700 font-bold mb-4">How to Make It</h2>
          <ol className="list-decimal list-inside space-y-3">
            {(recipe.steps ?? []).map((step) => (
              <li key={step.id} className="text-gray-800">
                {step.text}
              </li>
            ))}
          </ol>
        </section>

        <aside className="w-full md:w-72 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl text-gray-700 font-bold mb-4">Ingredients</h2>
          <ul className="list-disc list-inside space-y-2">
            {(recipe.ingredients ?? []).map((ingredient) => (
              <li key={ingredient.id} className="text-gray-800">
                {ingredient.name}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {Number.isFinite(recipeId) && (
        <section className="mt-12">
          <CommentsPanel recipeId={recipeId} />
        </section>
      )}
      
      {Number.isFinite(recipeId) && <RandomRecipes currentId={recipeId} />}
      <Footer />
    </main>
  );
}
