"use client";

import React from "react";
import { useAuth } from "@/app/context/AuthContext";

type CommentFormProps = {
  recipeId: number;
  onPosted?: () => void;
};

type ErrorJSON = { error?: unknown };
type PostSuccessJSON = { ok?: boolean; id?: number };

function isErrorJSON(v: unknown): v is ErrorJSON {
  return typeof v === "object" && v !== null && "error" in v;
}

export default function CommentForm({ recipeId, onPosted }: CommentFormProps) {
  const { me, loading } = useAuth();
  const [content, setContent] = React.useState<string>("");
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);

  if (loading) {
    return <p className="text-gray-500">Checking session…</p>;
  }
  if (!me) {
    return <p className="text-gray-700">Connecte-toi pour écrire un commentaire.</p>;
  }

  async function submit(e: React.FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    setError(null);
    const text = content.trim();
    if (!text) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId, content: text }),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        let message = "Impossible d'envoyer le commentaire";
        if (isErrorJSON(data)) {
          message = typeof data.error === "string" ? data.error : message;
        }
        throw new Error(message);
      }

      const okJson: PostSuccessJSON = await res.json().catch(() => ({}));
      if (!okJson.ok) {
      }

      setContent("");
      if (onPosted) onPosted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border rounded p-2 text-black"
        placeholder={`Écrire un commentaire en tant que ${me.name ?? me.email}…`}
        rows={3}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={submitting || content.trim().length === 0}
        className="bg-orange-500 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {submitting ? "Envoi…" : "Publier"}
      </button>
    </form>
  );
}
