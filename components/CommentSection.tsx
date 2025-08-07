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
  // plus de recipeId ici
}

export default function CommentSection({ initial }: Props) {
  const { user, token, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>(initial);

  const handleDelete = async (commentId: number) => {
    if (!token) {
      alert("Vous devez être connecté.");
      return;
    }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/comments/${commentId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (res.ok) {
      setComments((cs) => cs.filter((c) => c.id !== commentId));
    } else {
      alert("Échec de la suppression");
    }
  };

  // (Si tu as besoin d’une partie like, tu peux aussi la garder ici)

  return (
    <ul className="space-y-4">
      {comments.map((c) => (
        <li key={c.id} className="p-4 bg-gray-100 rounded-lg">
          <p className="text-gray-800 mb-2">{c.content}</p>
          <div className="flex justify-between text-sm text-gray-600">
            <div>
              Par <strong>{c.author.name || c.author.email}</strong> le{" "}
              {new Date(c.createdAt).toLocaleDateString()}
            </div>
            {isAuthenticated && user?.id === c.author.id && (
              <button
                onClick={() => handleDelete(c.id)}
                className="text-red-500"
              >
                Supprimer
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
