"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import LikeButton from "./LikeButton";

export interface RecipeCardProps {
  id: number;
  image: string;
  title: string;
  rating: string;
  author: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  id,
  image,
  title,
  rating,
  author,
}) => {
  return (
    <Link href={`/recipes/${id}`} className="block">
      <div className="relative bg-white shadow-lg rounded-lg overflow-hidden hover:bg-gray-100 cursor-pointer w-[300px] h-[300px]">
        <div className="relative w-full h-40">
          <Image src={image} alt={title} fill className="object-cover" />
        </div>
        <LikeButton
          recipeId={id}
          className="absolute top-2 right-2 bg-black bg-opacity-40 rounded-full p-2"
        />
        <div className="p-4">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-orange-500">⭐ {rating}</p>
          <p className="text-gray-600">by {author}</p>
        </div>
      </div>
    </Link>
  );
};

export default RecipeCard;
