"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";
import CommentForm from "@/components/CommentForm";

type Author = { id: number; name: string | null; email: string };
type Comment = {
  id: number;
  content: string;
  createdAt: string;
  author: Author;
};

type ListResponse = { items: Comment[] } | Comment[];

function normalizeList(data: ListResponse): Comment[] {
  return Array.isArray(data) ? data : data.items;
}

export default function CommentsPanel({ recipeId }: { recipeId: number }) {
  const { me, loading } = useAuth();
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [pending, setPending] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const url = new URL("/api/comments", window.location.origin);
      url.searchParams.set("recipeId", String(recipeId));
      const res = await fetch(url.toString(), {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Chargement des commentaires impossible");
      const data: ListResponse = await res.json();
      setComments(normalizeList(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      setComments([]);
    } finally {
      setPending(false);
    }
  }, [recipeId]);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <section id="comments" className="mt-10">
      <h2 className="text-2xl text-gray-700 font-bold mb-3">Comments</h2>

      {pending && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!pending && !error && comments.length === 0 && (
        <p className="text-gray-500">No comments yet.</p>
      )}

      {!pending && comments.length > 0 && (
        <ul className="space-y-4 mb-6">
          {comments.map((c) => (
            <li key={c.id} className="border rounded p-3">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
              <p className="mt-1 text-xs text-gray-500">
                by {c.author?.name ?? c.author?.email} • {new Date(c.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
      
      {loading ? (
        <p className="text-gray-500">Checking session…</p>
      ) : me ? (
        <CommentForm recipeId={recipeId} onPosted={load} />
      ) : (
        <p className="text-gray-700">🔒 Connecte-toi pour écrire un commentaire.</p>
      )}
    </section>
    
  );
  
}
