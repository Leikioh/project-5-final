"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import "tailwindcss/tailwind.css";
import { FaSearch, FaPlay, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import LikeButton from "@/components/LikeButton";
import Navbar from "@/components/Navbar";


// Types
interface Recipe {
  id: number;
  imageUrl: string;
  title: string;
  rating: string;
  author: { name: string | null };
}

const RecipeCard: React.FC<Recipe> = ({ id, imageUrl, title, rating, author }) => (
  <Link href={`/recipes/${id}`} className="block">
    <div className="relative bg-white shadow-lg rounded-lg overflow-hidden hover:bg-gray-100 cursor-pointer w-[300px] h-[300px]">
      <div className="relative w-full h-40">
        <Image src={imageUrl} alt={title} fill className="object-cover" priority />
      </div>
      <LikeButton
        recipeId={id}
        className="absolute top-2 right-2 bg-black bg-opacity-40 rounded-full p-2"
      />
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-orange-500 font-medium">⭐ {rating}</p>
        <p className="text-gray-600">by {author?.name ?? "Anonyme"}</p>
      </div>
    </div>
  </Link>
);

const Banner = () => (
  <div
    className="relative h-[500px] bg-cover bg-top flex items-center text-white text-left rounded-xl overflow-hidden mx-5 p-5 mt-20"
    style={{ backgroundImage: "url('/images/banniere.png')" }}
  >
    <div className="absolute inset-0 bg-black opacity-40 rounded-xl"></div>
    <div className="relative max-w-xl">
      <h1 className="text-5xl font-bold leading-tight">Choose from thousands of recipes</h1>
      <p className="mt-4 text-lg">
        Appropriately integrate technically sound value with scalable infomediaries negotiate
        sustainable strategic theme areas
      </p>
      <a
        href="/auth/sign-in"
        className="bg-orange-500 px-6 py-3 rounded-lg mt-4 inline-block text-white font-semibold"
      >
        Sign up today →
      </a>
    </div>
  </div>
);

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <aside className="bg-white p-6 rounded-lg w-64 flex-row">
      <h2 className="text-3xl font-bold mb-6 text-gray-950">Recipes</h2>
      <button
        className="w-full text-left font-bold text-gray-800 flex justify-between items-center"
        onClick={() => setIsOpen(!isOpen)}
      >
        Dish Type <span>{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen && (
        <ul className="mt-3 space-y-3 text-gray-700">
          {["Appetizers", "Bread", "Cake", "Casserole", "Main Dishes", "Pasta"].map((cat) => (
            <li key={cat}>
              <a href="#" className="hover:text-orange-500">
                {cat}
              </a>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
};

const SearchBar = ({
  search,
  onSearchChange,
}: {
  search: string;
  onSearchChange: (v: string) => void;
}) => (
  <div className="w-full flex justify-between items-center bg-white shadow-md rounded-lg p-4 mt-10 max-w-7xl mx-auto">
    <input
      type="text"
      className="w-full px-4 py-2 outline-none border-none text-black"
      placeholder="Search for recipes..."
      value={search}
      onChange={(e) => onSearchChange(e.target.value)}
    />
    <button className="bg-orange-500 p-3 text-white rounded-lg">
      <FaSearch />
    </button>
  </div>
);

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) => (
  <div className="flex justify-center mt-10 space-x-2">
    <button
      onClick={() => onPageChange(currentPage - 1)}
      disabled={currentPage === 1}
      className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-orange-500 hover:text-white disabled:opacity-50"
    >
      «
    </button>
    {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
      <button
        key={n}
        onClick={() => onPageChange(n)}
        className={`px-3 py-1 rounded ${
          n === currentPage ? "bg-orange-500 text-white" : "bg-gray-100 hover:bg-orange-500 hover:text-white"
        }`}
      >
        {n}
      </button>
    ))}
    <button
      onClick={() => onPageChange(currentPage + 1)}
      disabled={currentPage === totalPages}
      className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-orange-500 hover:text-white disabled:opacity-50"
    >
      »
    </button>
  </div>
);

const VideoSection = () => {
  const videos = [
    { src: "/videos/video1.mp4", title: "Cooking with Tomatoes" },
    { src: "/videos/video2.mp4", title: "Dessert in 5 minutes" },
    { src: "/videos/video3.mp4", title: "Healthy Breakfast Ideas" },
    { src: "/videos/video4.mp4", title: "Dinner for Two" },
  ];
  const [modalVideo, setModalVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (modalVideo && videoRef.current) {
      videoRef.current.volume = 0.2;
      videoRef.current.play().catch(() => {});
    }
  }, [modalVideo]);

  return (
    <section className="max-w-7xl mx-auto mt-12 px-9">
      <h2 className="text-3xl font-bold mb-6 text-gray-950">Videos</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video, index) => (
          <div
            key={index}
            className="relative rounded-xl overflow-hidden shadow-xl group cursor-pointer"
            onClick={() => setModalVideo(video.src)}
          >
            <video
              src={video.src}
              preload="metadata"
              className="w-full h-48 object-cover pointer-events-none brightness-90 group-hover:brightness-75 transition duration-300"
              muted
              playsInline
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black bg-opacity-40 rounded-full p-3 group-hover:bg-opacity-70 transition">
                <FaPlay className="text-white text-2xl" />
              </div>
            </div>
            <div className="absolute bottom-0 w-full bg-gradient-to-t from-black to-transparent text-white p-3 text-sm font-semibold truncate">
              {video.title}
            </div>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {modalVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl p-4"
            >
              <button onClick={() => setModalVideo(null)} className="absolute top-2 right-2 text-white text-xl">
                <FaTimes />
              </button>
              <motion.video
                ref={videoRef}
                key={modalVideo}
                src={modalVideo ?? undefined}
                controls
                autoPlay
                className="w-full rounded-lg shadow-lg"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

const Page: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages] = useState(1);

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/recipes`);
        const data = await res.json();
        setRecipes(Array.isArray(data.recipes) ? data.recipes : []);
      } catch (err) {
        console.error("❌ FETCH ERROR:", err);
        setRecipes([]);
      }
    };
    fetchRecipes();
  }, []);

  return (
    <div>
      <Navbar />
      <Banner />
      <SearchBar search={search} onSearchChange={setSearch} />
      <div className="container mx-auto py-10">
        <div className="flex gap-6 mt-6 max-w-7xl mx-auto">
          <Sidebar />
          <div className="flex-1">
            {recipes.length === 0 ? (
              <div className="text-center text-gray-500 text-lg py-10">No recipes found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {recipes.map((r) => (
                  <RecipeCard key={r.id} {...r} />
                ))}
              </div>
            )}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
          </div>
        </div>
      </div>
      <VideoSection />
    </div>
  );
};

export default Page;
