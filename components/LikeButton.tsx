"use client";

import React from "react";
import { apiPath } from "@/lib/api";

type Props = {
  recipeId: number;
  className?: string;
};

type FavoriteState = {
  liked: boolean;
  favoritesCount: number;
};

function isFavoriteState(v: unknown): v is FavoriteState {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.liked === "boolean" && typeof o.favoritesCount === "number";
}

export default function LikeButton({ recipeId, className }: Props) {
  const [liked, setLiked] = React.useState(false);
  const [count, setCount] = React.useState(0);
  const [busy, setBusy] = React.useState(false);

  // État initial
  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(apiPath(`/api/recipes/${recipeId}/favorite`), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const data: unknown = await res.json();
        if (alive && isFavoriteState(data)) {
          setLiked(data.liked);
          setCount(data.favoritesCount);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [recipeId]);

  const toggle = async (): Promise<void> => {
    if (busy) return;
    setBusy(true);

    const optimisticLiked = !liked;
    setLiked(optimisticLiked);
    setCount((c) => (optimisticLiked ? c + 1 : Math.max(0, c - 1)));

    try {
      const res = await fetch(apiPath(`/api/recipes/${recipeId}/favorite`), {
        method: optimisticLiked ? "POST" : "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        // rollback
        setLiked(!optimisticLiked);
        setCount((c) => (optimisticLiked ? Math.max(0, c - 1) : c + 1));
        if (res.status === 401) alert("Connecte-toi pour liker 👍");
        return;
      }

      const data: unknown = await res.json().catch(() => null);
      if (isFavoriteState(data)) {
        setLiked(data.liked);
        setCount(data.favoritesCount);
      }
    } catch {
      // rollback si erreur réseau
      setLiked(!optimisticLiked);
      setCount((c) => (optimisticLiked ? Math.max(0, c - 1) : c + 1));
    } finally {
      setBusy(false);
    }
  };

  const onClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
    e.preventDefault();
    void toggle();
  };

  const onMouseDown = (e: React.MouseEvent<HTMLButtonElement>): void => {
    e.stopPropagation();
  };

  return (
    <button
      type="button"
      aria-pressed={liked}
      aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
      onClick={onClick}
      onMouseDown={onMouseDown}
      disabled={busy}
      className={`flex items-center gap-2 rounded-full px-3 py-2 hover:bg-red-400 ${className ?? ""}`}
    >
      <span className={`text-xl ${liked ? "text-red-500" : "text-white"}`}>❤</span>
    </button>
  );
}
