// components/CommentSection.tsx
"use client";

import React, { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; name: string | null; email: string };
}

interface Props {
  initial: Comment[];
}

export default function CommentSection({ initial }: Props) {
  const { user, isAuthenticated } = useAuth(); // ← plus de token ici
  const [comments, setComments] = useState<Comment[]>(initial);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (commentId: number) => {
    if (!isAuthenticated) {
      alert("Vous devez être connecté.");
      return;
    }

    const ok = window.confirm("Supprimer ce commentaire ?");
    if (!ok) return;

    setDeletingId(commentId);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          // Si votre API utilise un cookie (session), laissez le navigateur l'envoyer :
          credentials: "include",
        }
      );

      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(msg || "Échec de la suppression");
      }

      setComments((cs) => cs.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error(err);
      alert("Échec de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-800 mb-2">{c.content}</p>
          <div className="flex justify-between text-sm text-gray-600">
            <div>
              Par <strong>{c.author.name || c.author.email}</strong> le{" "}
              {new Date(c.createdAt).toLocaleDateString("fr-FR")}
            </div>

            {isAuthenticated && user?.id === c.author.id && (
              <button
                onClick={() => handleDelete(c.id)}
                className={`text-red-500 ${
                  deletingId === c.id ? "opacity-60 cursor-not-allowed" : ""
                }`}
                disabled={deletingId === c.id}
                aria-busy={deletingId === c.id}
              >
                {deletingId === c.id ? "Suppression..." : "Supprimer"}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
