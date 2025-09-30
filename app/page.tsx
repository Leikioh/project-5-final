"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaSearch, FaPlay, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import  Footer  from "@/components/Footer";
import LikeButton from "@/components/LikeButton";
import { apiPath } from "@/lib/api";

type Recipe = {
  id: number;
  imageUrl: string | null;
  title: string;
  author: { name: string | null };
};

type RecipesResponse =
  | {
      items: Recipe[];
      total: number;
      page: number;
      pageCount: number;
    }
  | Recipe[];


const Banner = () => (
  <div className="relative max-w-7xl mx-auto rounded-2xl overflow-hidden">
    <div className="relative aspect-[64/23] md:aspect-[64/25] lg:aspect-[64/27]">
      <Image
        src="/images/banner_full_2560x1080.png"
        alt="Cooking banner"
        fill
        className="object-cover"
        sizes="(max-width: 1280px) 100vw, 1280px"
        priority
      />
      <div className="absolute inset-0 bg-black/35" />

      <div className="absolute inset-y-0 left-6 md:left-10 flex items-center">
        <div className="max-w-xl text-white">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Choose from thousands of recipes
          </h1>
          <p className="mt-3 md:mt-4 text-base md:text-lg">
            Appropriately integrate technically sound value with scalable infomediaries…
          </p>
          <a
            href="/auth/sign-in"
            className="inline-block bg-orange-500 px-5 md:px-6 py-2.5 md:py-3 rounded-lg mt-4 font-semibold text-white"
          >
            Sign up today →
          </a>
        </div>
      </div>
    </div>
  </div>
);

const Sidebar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <aside className="bg-white p-6 rounded-lg w-full lg:w-64">
      <h2 className="text-3xl font-bold mb-6 text-gray-950">Recipes</h2>
      <button
        className="w-full text-left font-bold text-gray-800 flex justify-between items-center"
        onClick={() => setIsOpen((v) => !v)}
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

function SearchBar({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="w-full flex justify-between items-center bg-white shadow-md rounded-lg p-4 mt-10 max-w-7xl mx-auto">
      <input
        type="text"
        className="w-full px-4 py-2 outline-none border-none text-black"
        placeholder="Search for recipes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onSubmit();
        }}
      />
      <button onClick={onSubmit} className="bg-orange-500 p-3 text-white rounded-lg">
        <FaSearch />
      </button>
    </div>
  );
}

function Pagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (p: number) => void;
}) {
  if (pageCount <= 1) return null;

  const pages = Array.from({ length: pageCount }, (_, i) => i + 1);
  return (
    <div className="flex justify-center mt-10 space-x-2">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-orange-500 hover:text-white disabled:opacity-50"
      >
        «
      </button>
      {pages.map((n) => (
        <button
          key={n}
          onClick={() => onChange(n)}
          className={`px-3 py-1 rounded ${
            n === page ? "bg-orange-500 text-white" : "bg-gray-100 hover:bg-orange-500 hover:text-white"
          }`}
        >
          {n}
        </button>
      ))}
      <button
        onClick={() => onChange(Math.min(pageCount, page + 1))}
        disabled={page === pageCount}
        className="px-3 py-1 bg-gray-200 text-black rounded hover:bg-orange-500 hover:text-white disabled:opacity-50"
      >
        »
      </button>
    </div>
  );
}

function VideoSection() {
  const videos = [
    { src: "/videos/video1.mp4", title: "Japanese Restaurant Meet" },
    { src: "/videos/video2.mp4", title: "Indian Tajine" },
    { src: "/videos/video3.mp4", title: "Healthy Breakfast Ideas" },
    { src: "/videos/video4.mp4", title: "Perfect egg" },
  ];
  const [modalVideo, setModalVideo] = React.useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (modalVideo && videoRef.current) {
      videoRef.current.volume = 0.2;
      void videoRef.current.play().catch(() => {});
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
}


function NewsletterCTA(): React.JSX.Element {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle");

  const submit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const value = email.trim();
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (!valid) {
      setStatus("error");
      return;
    }
    setStatus("loading");

    setTimeout(() => {
      setStatus("success");
      setEmail("");
    }, 600);
  };

  return (
    <section className="max-w-6xl mx-auto mt-12 px-6">
      <div className="bg-orange-500 rounded-2xl px-8 py-10 md:px-12 md:py-12 text-center shadow-lg">
        <h3 className="text-white text-2xl md:text-3xl font-bold leading-snug">
          Be the first to know about the latest deals,
          <br className="hidden md:block" /> receive new trending recipes &amp; more!
        </h3>

        <form onSubmit={submit} className="mt-7 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center">
          <label htmlFor="newsletter-email" className="sr-only">
            Email Address
          </label>
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status !== "idle") setStatus("idle");
            }}
            placeholder="Email Address"
            className="w-full sm:w-[380px] px-5 py-3 rounded-full bg-transparent border border-white/70 placeholder-white/90 text-white focus:outline-none focus:ring-2 focus:ring-white"
            aria-invalid={status === "error"}
            aria-describedby="newsletter-help"
          />
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-3 rounded-full bg-yellow-300 hover:bg-yellow-400 text-black font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {status === "loading" ? "Subscribing…" : "Subscribe"}
          </button>
        </form>

        <div id="newsletter-help" className="mt-2 text-sm">
          {status === "error" && <p className="text-white/90">Please enter a valid email.</p>}
          {status === "success" && <p className="text-white/90">Thanks! You’re on the list ✅</p>}
        </div>
      </div>
    </section>
  );
}


export default function Page() {
  const TAKE = 9;
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);

  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [search, setSearch] = React.useState("");
  const lastSearchRef = React.useRef("");

  const load = React.useCallback(async (p: number, q: string) => {
    setLoading(true);
    setError(null);

    const url = new URL(apiPath("/api/recipes"), window.location.origin);
    url.searchParams.set("page", String(p));
    url.searchParams.set("take", String(TAKE));
    if (q.trim()) url.searchParams.set("q", q.trim());

    try {
      const res = await fetch(url.toString(), { cache: "no-store", credentials: "include" });
      if (!res.ok) {
        const res2 = await fetch(apiPath("/api/recipes"), { cache: "no-store" });
        const data2: RecipesResponse = await res2.json();
        if (Array.isArray(data2)) {
          const total = data2.length;
          const pc = Math.max(1, Math.ceil(total / TAKE));
          setPageCount(pc);
          const start = (p - 1) * TAKE;
          const items = data2.slice(start, start + TAKE);
          setRecipes(items);
        } else {
          setRecipes(data2.items);
          setPageCount(data2.pageCount);
        }
        return;
      }

      const data: RecipesResponse = await res.json();

      if (Array.isArray(data)) {
        const total = data.length;
        const pc = Math.max(1, Math.ceil(total / TAKE));
        setPageCount(pc);
        const start = (p - 1) * TAKE;
        const items = data.slice(start, start + TAKE);
        setRecipes(items);
      } else {
        setRecipes(data.items);
        setPageCount(Math.max(1, data.pageCount));
      }
    } catch {
      setError("Erreur de chargement des recettes.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load(page, lastSearchRef.current);
  }, [page, load]);

  const triggerSearch = React.useCallback(() => {
    lastSearchRef.current = search;
    setPage(1);
    void load(1, search);
  }, [search, load]);

  return (
    <div>
      
      <Banner />

      <SearchBar value={search} onChange={setSearch} onSubmit={triggerSearch} />

      <div className="container mx-auto py-10">
        <div className="flex flex-col lg:flex-row gap-6 mt-6 max-w-7xl mx-auto">
          <Sidebar />

          <div className="flex-1">
            {loading && <div className="text-center text-gray-500 text-lg py-10">Loading…</div>}
            {error && <div className="text-center text-red-500 text-lg py-10">{error}</div>}

            {!loading && !error && recipes.length === 0 && (
              <div className="text-center text-gray-500 text-lg py-10">No recipes found.</div>
            )}

            {!loading && !error && recipes.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                  {recipes.map((recipe: Recipe) => (
                    <Link key={recipe.id} href={`/recipes/${recipe.id}`} className="block">
                      <article className="relative bg-white shadow rounded-lg overflow-hidden hover:bg-gray-100">
                        <div className="relative aspect-[4/3]">
                          <Image
                            src={recipe.imageUrl ?? "/images/placeholder.jpg"}
                            alt={recipe.title}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 300px"
                            priority
                          />
                          <LikeButton recipeId={recipe.id} className="absolute top-2 right-2" />
                        </div>

                        <div className="p-3">
                          <h3 className="text-sm sm:text-base font-semibold text-gray-800 line-clamp-2">
                            {recipe.title}
                          </h3>
                          <p className="text-xs sm:text-sm text-gray-600">
                            by {recipe.author?.name ?? "Anonyme"}
                          </p>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>

                <Pagination page={page} pageCount={pageCount} onChange={setPage} />
              </>
            )}
          </div>
        </div>
      </div>

      <VideoSection />
      <NewsletterCTA />
      <Footer />
    </div>
  );
}

