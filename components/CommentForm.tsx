"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { apiPath } from "@/lib/api";

type Props = {
  recipeId: number;
  onPosted?: (c: PostedComment) => void;
};

type PostedComment = {
  id: number;
  content: string;
  createdAt: string;
  author: { id?: number; name: string | null; email?: string };
};

export default function CommentForm({ recipeId, onPosted }: Props) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ plus de token ici : on utilise seulement l’état d’auth
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = content.trim();
    if (!text) return;

    if (!isAuthenticated) {
      router.push("/auth/sign-in");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(apiPath("/api/comments"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // cookies
        body: JSON.stringify({ recipeId, content: text }),
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const created = (await res.json()) as PostedComment;
      onPosted?.(created);
      setContent("");
    } catch (err) {
      console.error("CommentForm POST error:", err);
      setError("Impossible d'envoyer le commentaire.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write a comment…"
        className="w-full border rounded p-2 text-gray-800"
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <button
        type="submit"
        disabled={submitting || !content.trim()}
        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Post Comment"}
      </button>
    </form>
  );
}
