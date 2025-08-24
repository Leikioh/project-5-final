"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { FaClock, FaUtensils } from "react-icons/fa";
import { useCurrentUser } from "../../hooks/useCurrentUser";

interface Step { id: number; text: string; }
interface Ingredient { id: number; name: string; }
interface Comment {
  id: number;
  author: { name: string | null };
  content: string;
  createdAt: string;
}
interface Author { id: number; name: string | null; }

interface Recipe {
  id: number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  author: Author;
  steps: Step[];
  ingredients: Ingredient[];
  comments: Comment[];
  favoritesCount: number;
  activeTime?: string;
  totalTime?: string;
  yield?: string;
}

/* RECETTES ALÉATOIRES */
function RandomRecipes({ currentId }: { currentId: number }) {
  type ListItem = {
    id: number;
    title: string;
    imageUrl: string;
    author: { id: number; name: string | null };
  };

  const [all, setAll] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recipes`, { cache: "no-store" });
        const data = await res.json();
        const list: ListItem[] = Array.isArray(data.recipes) ? data.recipes : [];
        if (mounted) setAll(list);
      } catch {
        if (mounted) setAll([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const picks = useMemo(() => {
    const pool = all.filter(r => r.id !== currentId);
    
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 4);
  }, [all, currentId]);

  if (loading || picks.length === 0) return null;

  return (
    <section className="mt-14">
      <h2 className="text-2xl font-bold mb-4  text-gray-800">Recettes similaires</h2>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {picks.map((r) => (
          <Link key={r.id} href={`/recipes/${r.id}`} className="block group">
            <div className="bg-white rounded-lg h-[260px] line-clamp-2 shadow hover:shadow-lg transition overflow-hidden">
              <div className="relative h-40">
                {r.imageUrl && (
                  <Image
                    src={r.imageUrl}
                    alt={r.title}
                    fill
                    className="object-cover group-hover:scale-[1.02] transition"
                  />
                )}
              </div>
              <div className="p-3">
                <p className="text-sm text-gray-500 mb-1">
                  {r.author?.name ?? "Anonyme"}
                </p>
                <h3 className="text-base font-semibold text-gray-800 line-clamp-2">
                  {r.title}
                </h3>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}


export default function RecipeDetailPage() {
  const params = useParams();
  const recipeId = Array.isArray(params?.id) ? Number(params.id[0]) : Number(params?.id);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const { user, loading: userLoading } = useCurrentUser();

  useEffect(() => {
    if (!recipeId) return;
    const fetchRecipe = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recipes/${recipeId}`);
        const data = await res.json();
        setRecipe(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecipe();
  }, [recipeId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment || !recipeId) return;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recipes/${recipeId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
        credentials: "include",
      });

      const responseText = await res.text();
      if (!res.ok) {
        console.error("❌ Failed to post comment. Status:", res.status);
        console.error("🧾 Server response:", responseText);
        alert("Erreur lors de l’envoi du commentaire : " + responseText);
        return;
      }

      const updatedRecipe = JSON.parse(responseText);
      setRecipe(updatedRecipe);
      setNewComment("");
    } catch (err) {
      console.error("💥 Error submitting comment:", err);
      alert("Erreur technique lors de l’envoi.");
    }
  };

  if (loading || userLoading) return <p className="text-center py-10">Chargement...</p>;
  if (!recipe) return <p className="text-center py-10 text-red-500">Recette introuvable.</p>;

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {/* Image + Title */}
      <div className="relative w-full h-[400px] rounded-lg overflow-hidden mb-8 shadow-lg">
        {recipe.imageUrl && (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
            priority
          />
        )}
      </div>
      <h1 className="text-4xl font-bold mb-2 text-gray-900">{recipe.title}</h1>
      <p className="text-gray-600 mb-6">by {recipe.author?.name ?? "Anonyme"}</p>

      {/* Description */}
      {recipe.description && (
        <p className="text-lg text-gray-800 mb-8">{recipe.description}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <div className="flex gap-6 my-4">
          <div className="flex items-center gap-2">
            <FaClock className="text-orange-500" />
            <span className="text-gray-700">{recipe.activeTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaClock className="text-orange-500" />
            <span className="text-gray-700">{recipe.totalTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <FaUtensils className="text-orange-500" />
            <span className="text-gray-700">{recipe.yield}</span>
          </div>
        </div>
        <div className="bg-orange-50 p-4 rounded shadow text-center">
          <p className="text-orange-500 text-sm font-bold">Favorites</p>
          <p className="text-lg font-semibold text-gray-800">{recipe?.favoritesCount ?? 0}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* How to make it */}
        <section className="flex-1">
          <h2 className="text-2xl text-gray-700 font-bold mb-4">How to Make It</h2>
          <ol className="list-decimal list-inside space-y-3">
            {(recipe.steps || []).map((step) => (
              <li key={step.id} className="text-gray-800">{step.text}</li>
            ))}
          </ol>
        </section>

        {/* Ingredients */}
        <aside className="w-full md:w-72 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl text-gray-700 font-bold mb-4">Ingredients</h2>
          <ul className="list-disc list-inside space-y-2">
            {(recipe.ingredients || []).map((ingredient) => (
              <li key={ingredient.id} className="text-gray-800">{ingredient.name}</li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Comments */}
      <section className="mt-12">
        <h2 className="text-2xl text-black font-bold mb-4">Comments</h2>
        {recipe.comments?.length === 0 ? (
          <p className="text-gray-500">No comments yet.</p>
        ) : (
          <div className="space-y-4">
            {recipe.comments.map((c) => (
              <div key={c.id} className="border-b pb-2">
                <p className="font-semibold text-orange-500">{c.author?.name ?? "Anonyme"}</p>
                <p className="text-gray-700">{c.content}</p>
                <p className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleDateString()}</p>
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
              onChange={(e) => setNewComment(e.target.value)}
              className="border p-2 text-gray-700 rounded w-full"
            />
            <button type="submit" className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              Post Comment
            </button>
          </form>
        ) : (
          <p className="text-sm text-gray-500 mt-4">🔐 Connecte-toi pour écrire un commentaire.</p>
        )}
      </section>

      {/* ✅ 4 recettes aléatoires ici */}
      {Number.isFinite(recipeId) && <RandomRecipes currentId={recipeId!} />}
    </main>
  );
}
