"use client";

import React, { JSX, useEffect, useState } from "react";
import { apiPath } from "@/lib/api";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";

type Props = { recipeId: number; className?: string };

export default function LikeButton({ recipeId, className }: Props): JSX.Element {
  const { user } = useCurrentUser();
  const [liked, setLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // état initial
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(apiPath(`/api/recipes/${recipeId}/favorite`), {
          credentials: "include",
          cache: "no-store",
        });
        if (!res.ok) return;
        const j: unknown = await res.json().catch(() => null);
        if (
          alive &&
          j &&
          typeof j === "object" &&
          "liked" in j &&
          typeof (j as { liked: unknown }).liked === "boolean"
        ) {
          setLiked((j as { liked: boolean }).liked);
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
    if (!user) {
      alert("Connecte-toi pour liker.");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(apiPath(`/api/recipes/${recipeId}/favorite`), {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return;
      const j: unknown = await res.json().catch(() => null);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (j && typeof j === "object" && "liked" in j && typeof (j as any).liked === "boolean") {
        setLiked((j as { liked: boolean }).liked);
      } else {
        setLiked((v) => !v); // fallback optimiste
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => { void toggle(); }}
      aria-pressed={liked}
      aria-label={liked ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={className ?? ""}
      disabled={loading}
      title={liked ? "Unlike" : "Like"}
    >
      {/* Cœur */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={liked ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        className={`w-6 h-6 ${liked ? "text-red-500" : "text-white"}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733C11.285 4.876 9.623 3.75 7.688 3.75 5.099 3.75 3 5.765 3 8.25c0 7.125 9 12 9 12s9-4.875 9-12z"
        />
      </svg>
    </button>
  );
}
