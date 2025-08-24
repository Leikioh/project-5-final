"use client";
import React, { useEffect, useState } from "react";

type Props = {
  recipeId: number;
  className?: string;
};

export default function LikeButton({ recipeId, className }: Props) {
  const [liked, setLiked] = useState(false);

  const [loading, setLoading] = useState(false);

  // Charger l'état initial du like
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/likes/${recipeId}`,
          { credentials: "include", cache: "no-store" }
        );
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) {
          setLiked(!!data.liked);
          
        }
      } catch (err) {
        console.error(err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId]);

  const onClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/likes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipeId }),
      });

      if (res.status === 401) {
        alert("Connecte-toi pour liker ✨");
        return;
      }
      if (!res.ok) return;

      const { liked: newLiked, } = await res.json();
      setLiked(newLiked);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
<button
  type="button"
  onClick={onClick}
  aria-pressed={liked}
  className={`bg-transparent shadow-none border-none outline-none p-0 ${className ?? ""}`}
>
  <span className={liked ? "text-red-500 text-xl" : "text-gray-400 text-xl"}>
    {liked ? "❤️" : "🤍"}
  </span>
</button>
  );
}
