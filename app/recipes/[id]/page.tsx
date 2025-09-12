"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { JSX } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaClock, FaUtensils } from "react-icons/fa";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import { apiPath } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Step = { id: number; text: string };
type Ingredient = { id: number; name: string };
type Author = { id: number; name: string | null };

type CommentItem = {
  id: number;
  author: { id?: number; name: string | null; email?: string };
  content: string;
  createdAt: string;
};

type CommentPayload = {
  id: number;
  content: string;
  createdAt: string;
  author?: { id?: number; name: string | null; email?: string };
};

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

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function isCommentPayload(v: unknown): v is CommentPayload {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === "number" &&
    typeof o.content === "string" &&
    typeof o.createdAt === "string"
  );
}

/* ── Sous-composant: suggestions aléatoires ───────────────────────────────── */

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
        const res = await fetch(apiPath("/api/recipes"), { cache: "no-store", credentials: "include" });
        if (!res.ok) {
          if (mounted) setAll([]);
          return;
        }
        const data: unknown = await res.json().catch(() => null);
        const list: ListItem[] = Array.isArray(data)
          ? (data as Array<Record<string, unknown>>)
              .map((r) => ({
                id: typeof r.id === "number" ? r.id : NaN,
                title: typeof r.title === "string" ? r.title : "",
                imageUrl: typeof r.imageUrl === "string" ? r.imageUrl : null,
                author:
                  typeof r === "object" &&
                  r !== null &&
                  "author" in r &&
                  typeof (r as { author: unknown }).author === "object" &&
                  (r as { author: Record<string, unknown> }).author !== null
                    ? {
                        id:
                          typeof (r as { author: Record<string, unknown> }).author.id === "number"
                            ? ((r as { author: Record<string, unknown> }).author.id as number)
                            : NaN,
                        name:
                          typeof (r as { author: Record<string, unknown> }).author.name === "string" ||
                          (r as { author: Record<string, unknown> }).author.name === null
                            ? ((r as { author: Record<string, unknown> }).author.name as string | null)
                            : null,
                      }
                    : { id: NaN, name: null },
              }))
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
    // shuffle
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

/* ── Page détail ───────────────────────────────────────────────────────────── */

export default function RecipeDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const recipeId = Number(id);

  const [recipe, setRecipe] = useState<RecipeAPI | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newComment, setNewComment] = useState<string>("");

  const { user, loading: userLoading } = useCurrentUser();

  // Charger recette + commentaires
  useEffect(() => {
    if (!Number.isFinite(recipeId)) return;

    let mounted = true;

    const load = async (): Promise<void> => {
      setLoading(true);
      try {
        // 1) Recette
        const res = await fetch(apiPath(`/api/recipes/${recipeId}`), {
          cache: "no-store",
          credentials: "include",
        });
        if (res.ok) {
          const data: unknown = await res.json().catch(() => null);
          const r = data as Partial<RecipeAPI> | null;

          if (
            r &&
            typeof r === "object" &&
            typeof r.id === "number" &&
            typeof r.title === "string"
          ) {
            if (mounted) {
              setRecipe({
                id: r.id,
                title: r.title,
                description: (r.description ?? null) as string | null,
                imageUrl: (r.imageUrl ?? null) as string | null,
                author: (r.author ?? { id: NaN, name: null }) as Author,
                steps: Array.isArray(r.steps) ? (r.steps as Step[]) : [],
                ingredients: Array.isArray(r.ingredients) ? (r.ingredients as Ingredient[]) : [],
                activeTime: (r.activeTime ?? null) as string | null,
                totalTime: (r.totalTime ?? null) as string | null,
                yield: (r.yield ?? null) as string | null,
                _count: (r._count ?? undefined) as RecipeAPI["_count"],
              });
            }
          } else if (mounted) {
            setRecipe(null);
          }
        } else if (mounted) {
          setRecipe(null);
        }

        // 2) Commentaires
        const resC = await fetch(apiPath(`/api/comments?recipeId=${recipeId}`), {
          cache: "no-store",
          credentials: "include",
        });
        if (resC.ok) {
          const cc: unknown = await resC.json().catch(() => null);
          const list: CommentItem[] = Array.isArray(cc)
            ? (cc as Array<Record<string, unknown>>)
                .map((c) => ({
                  id: typeof c.id === "number" ? c.id : NaN,
                  author:
                    typeof c === "object" &&
                    c !== null &&
                    "author" in c &&
                    typeof (c as { author: unknown }).author === "object" &&
                    (c as { author: Record<string, unknown> }).author !== null
                      ? {
                          name:
                            typeof (c as { author: Record<string, unknown> }).author.name === "string" ||
                            (c as { author: Record<string, unknown> }).author.name === null
                              ? ((c as { author: Record<string, unknown> }).author.name as string | null)
                              : null,
                          email:
                            typeof (c as { author: Record<string, unknown> }).author.email === "string"
                              ? ((c as { author: Record<string, unknown> }).author.email as string)
                              : undefined,
                          id:
                            typeof (c as { author: Record<string, unknown> }).author.id === "number"
                              ? ((c as { author: Record<string, unknown> }).author.id as number)
                              : undefined,
                        }
                      : { name: null },
                  content: typeof c.content === "string" ? (c.content as string) : "",
                  createdAt: typeof c.createdAt === "string" ? (c.createdAt as string) : new Date().toISOString(),
                }))
                .filter((x) => Number.isFinite(x.id) && x.content.length > 0)
            : [];
          if (mounted) setComments(list);
        } else if (mounted) {
          setComments([]);
        }
      } catch {
        if (mounted) {
          setRecipe(null);
          setComments([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [recipeId]);

  const handleCommentSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const content = newComment.trim();
    if (!content || !Number.isFinite(recipeId)) return;

    try {
      // Notre API crée un commentaire via /api/comments (body: { recipeId, content })
      const res = await fetch(apiPath("/api/comments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipeId, content }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        alert(`Erreur lors de l’envoi du commentaire. ${txt}`);
        return;
      }

      // Réponse attendue: { id, content, createdAt, author? }
      const createdUnknown: unknown = await res.json().catch(() => null);

      if (isCommentPayload(createdUnknown)) {
        const a = createdUnknown.author;
        const author: CommentItem["author"] = {
          id: typeof a?.id === "number" ? a.id : undefined,
          name: (a?.name ?? null) as string | null,
          email: typeof a?.email === "string" ? a.email : undefined,
        };

        const newC: CommentItem = {
          id: createdUnknown.id,
          content: createdUnknown.content,
          createdAt: createdUnknown.createdAt,
          author,
        };

        setComments((prev) => [newC, ...prev]);
        setNewComment("");
      } else {
        // fallback : recharger la liste
        const again = await fetch(apiPath(`/api/comments?recipeId=${recipeId}`), {
          cache: "no-store",
          credentials: "include",
        });
        if (again.ok) {
          const list = (await again.json().catch(() => [])) as CommentItem[];
          setComments(Array.isArray(list) ? list : []);
          setNewComment("");
        }
      }
    } catch {
      alert("Erreur technique lors de l’envoi.");
    }
  };

  if (loading || userLoading) return <p className="text-center py-10">Chargement...</p>;
  if (!recipe) return <p className="text-center py-10 text-red-500">Recette introuvable.</p>;

  const favoritesCount = recipe._count?.favorites ?? 0;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Image + Title */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-8 shadow-lg">
        <Image
          src={recipe.imageUrl ?? "/images/placeholder.jpg"}
          alt={recipe.title}
          fill
          className="object-cover"
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

      {/* Description */}
      {recipe.description && <p className="text-lg text-gray-800 mb-8">{recipe.description}</p>}

      {/* Stats */}
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
        {/* How to make it */}
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

        {/* Ingredients */}
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

      {/* Comments */}
      <section className="mt-12">
        <h2 className="text-2xl text-black font-bold mb-4">Comments</h2>

        {comments.length === 0 ? (
          <p className="text-gray-500">No comments yet.</p>
        ) : (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="border-b pb-2">
                <p className="font-semibold text-orange-500">{c.author?.name ?? "Anonyme"}</p>
                <p className="text-gray-700">{c.content}</p>
                <p className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* New comment form */}
        {user ? (
          <form onSubmit={handleCommentSubmit} className="mt-6 space-y-4">
            <textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
              className="border p-2 text-gray-700 rounded w-full"
            />
            <button
              type="submit"
              className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
            >
              Post Comment
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 mt-4">🔐 Connecte-toi pour écrire un commentaire.</p>
        )}
      </section>

      {/* 4 recettes aléatoires */}
      {Number.isFinite(recipeId) && <RandomRecipes currentId={recipeId} />}
    </main>
  );
}
