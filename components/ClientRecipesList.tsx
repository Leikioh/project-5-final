"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import LikeButton from "./LikeButton";

export interface RecipeCardProps {
  id: number;
  image: string;           // peut être une URL ou vide -> on gère un fallback
  title: string;
  rating: string;          // affichage simple ⭐
  author: string;
  slug: string;            // utilisé pour la route et le like
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  id,
  image,
  title,
  rating,
  author,
  slug,
}) => {
  const imgSrc = image || "/images/placeholder.jpg";

  return (
    <Link href={`/recipes/${slug}`} className="block" prefetch>
      <article
        className="relative bg-white shadow rounded-lg overflow-hidden hover:shadow-md hover:bg-gray-50 transition"
        data-id={id}
      >
        {/* Zone image en ratio 4/3 pour rester responsive */}
        <div className="relative w-full aspect-[4/3]">
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority
          />
          {/* Bouton like en haut à droite */}
          <LikeButton
            recipeSlug={slug}
            className="absolute top-2 right-2 bg-black/40 rounded-full p-2"
          />
        </div>

        {/* Contenu */}
        <div className="p-4">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 line-clamp-2">
            {title}
          </h3>
          <div className="mt-1 flex items-center justify-between text-sm">
            <p className="text-orange-500">⭐ {rating}</p>
            <p className="text-gray-600">by {author || "Anonyme"}</p>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default RecipeCard;
