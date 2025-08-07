// components/LikeButton.tsx
"use client";

import React, { useState, useEffect } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";

interface LikeButtonProps {
  recipeId: number;
  // permet de passer positionnement + styles spécifiques
  className?: string;
}

export default function LikeButton({
  recipeId,
  className = "",
}: LikeButtonProps) {
  const { token, isAuthenticated } = useAuth();
  const [count, setCount] = useState(0);
  const [liked, setLiked] = useState(false);

  // Charge état initial
  useEffect(() => {
    const headers: Record<string,string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/likes/${recipeId}`, {
      cache: "no-store",
      headers,
    })
      .then((r) => r.json())
      .then((data: { count: number; liked?: boolean }) => {
        setCount(data.count);
        if (typeof data.liked === "boolean") setLiked(data.liked);
      })
      .catch(console.error);
  }, [recipeId, token]);

  // Toggle like/unlike
  const toggle = async () => {
    if (!isAuthenticated || !token) {
      alert("Connectez-vous pour liker !");
      return;
    }
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/likes`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ recipeId }),
      }
    );
    const data = (await res.json()) as { liked: boolean; count: number };
    setLiked(data.liked);
    setCount(data.count);
  };

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        e.preventDefault();
        toggle();
      }}
      className={`${className} flex items-center gap-1 focus:outline-none`}
      aria-label={liked ? "Retirer le like" : "Ajouter un like"}
    >
      {liked ? (
        <FaHeart className="h-6 w-6 text-red-500" />
      ) : (
        <FaRegHeart className="h-6 w-6 text-white" />
      )}
      <span className="text-sm text-white">{count}</span>
    </button>
  );
}
