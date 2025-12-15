"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";
import CommentForm from "@/components/CommentForm";

type Author = { id: number; name: string | null; email: string };
type CommentItem = { id: number; content: string; createdAt: string; author: Author };

type Props = {
  recipeId: number;            // ← toujours présent
  recipeSlug?: string | null;  // ← optionnel (peut être null)
};

export default function CommentsPanel({ recipeId, recipeSlug }: Props) {
  const { me, loading } = useAuth();
  const [comments, setComments] = React.useState<CommentItem[]>([]);
  const [pending, setPending] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const url = recipeSlug
        ? `/api/recipes/${encodeURIComponent(recipeSlug)}/comments`
        : `/api/comments?recipeId=${recipeId}`;

      const res = await fetch(url, { cache: "no-store", credentials: "include" });
      if (!res.ok) throw new Error(`Failed to load comments (${res.status})`);
      const json = (await res.json()) as { items: CommentItem[] } | CommentItem[];

      const items = Array.isArray(json) ? json : json.items;
      setComments(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
      setComments([]);
    } finally {
      setPending(false);
    }
  }, [recipeId, recipeSlug]);

  React.useEffect(() => { void load(); }, [load]);

  return (
    <section id="comments" className="mt-10">

      {pending && <p className="text-gray-500">Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!pending && !error && comments.length === 0 && (
        <p className="text-gray-500">No comments yet.</p>
      )}

      {!pending && comments.length > 0 && (
        <ul className="space-y-4 mb-6">
          {comments.map((c) => (
            <li key={c.id} className="border rounded p-3 bg-white">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
              <p className="mt-1 text-xs text-gray-500">
                by {c.author.name ?? c.author.email} • {new Date(c.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      {loading ? (
        <p className="text-gray-500">Checking session…</p>
      ) : me ? (
        // ✅ on garde CommentForm tel quel (il prend un recipeId: number)
        <CommentForm recipeId={recipeId} onPosted={load} />
      ) : (
        <p className="text-gray-700">🔒 Connecte-toi pour écrire un commentaire.</p>
      )}
    </section>
  );
}
