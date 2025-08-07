// components/CommentForm.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

interface CommentFormProps {
  recipeId: number;
}

export default function CommentForm({ recipeId }: CommentFormProps) {
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { token, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!content.trim()) {
      setError("Le commentaire ne peut pas être vide.");
      return;
    }
    if (!isAuthenticated || !token) {
      setError("Vous devez être connecté pour commenter.");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ recipeId, content }),
        }
      );
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message ?? "Erreur lors de l'envoi du commentaire.");
      }
      setContent("");
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}
      <textarea
        id="comment-content"
        name="comment"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="w-full p-2 text-gray-700 border rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
        placeholder="Écrire un commentaire..."
        autoComplete="off"
      />
      <button
        type="submit"
        className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
      >
        Poster
      </button>
    </form>
  );
}
