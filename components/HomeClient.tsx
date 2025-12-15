// components/HomeClient.tsx
"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FaPlay, FaTimes } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import Footer from "@/components/Footer";
import LikeButton from "@/components/LikeButton";
import { apiPath } from "@/lib/api";
import Pagination from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";

type Recipe = {
  id: number;
  imageUrl: string | null;
  title: string;
  author: { name: string | null };
  slug: string;
};

type RecipesResponse =
  | { items: Recipe[]; total: number; page: number; pageCount: number }
  | Recipe[];

/* ── Banner ── */
const Banner = () => (
  <div
    className="relative max-w-7xl mx-auto rounded-2xl overflow-hidden"
    role="img"
    aria-label="Bannière CookHub avec plats appétissants"
  >
    <div className="relative aspect-[64/40] sm:aspect-[64/30] md:aspect-[64/25] lg:aspect-[64/27]">
      <Image
        src="/images/banner_full_2560x1080.png"
        alt="Assortiment de plats en bannière"
        fill
        className="object-cover"
        sizes="(max-width: 1280px) 100vw, 1280px"
        priority
      />

      {/* Voile sombre pour lisibilité */}
      <div className="absolute inset-0 bg-black/45" />

      {/* Contenu texte */}
      <div className="absolute inset-y-0 left-4 sm:left-8 md:left-10 flex items-center">
        <div className="max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl text-white drop-shadow-lg">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold leading-tight tracking-tight">
            Choose from thousands of recipes
          </h1>

          <p className="mt-3 sm:mt-4 text-sm sm:text-base md:text-lg text-white/90">
            Discover, cook, and share delicious dishes made by passionate chefs
            and food lovers around the world.
          </p>

          <a
            href="/auth/sign-in"
            className="inline-block bg-orange-500 hover:bg-orange-600 transition-colors px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-lg mt-4 font-semibold text-white text-sm sm:text-base"
          >
            Sign up today →
          </a>
        </div>
      </div>
    </div>
  </div>
);

/* ── Sidebar ── */
const Sidebar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <aside className="bg-white p-6 rounded-lg w-full lg:w-64" aria-label="Filtres recettes">
      <h2 className="text-3xl font-bold mb-6 text-gray-950">Recipes</h2>
      <button
        className="w-full text-left font-bold text-gray-800 flex justify-between items-center"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-controls="filters-dish-type"
      >
        Dish Type <span aria-hidden>{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen && (
        <ul id="filters-dish-type" className="mt-3 space-y-3 text-gray-700">
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

/* ── Videos ── */
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
    <section className="max-w-7xl mx-auto mt-12 px-9" aria-labelledby="videos-title">
      <h2 id="videos-title" className="text-3xl font-bold mb-6 text-gray-950">
        Videos
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {videos.map((video, index) => (
          <div
            key={index}
            className="relative rounded-xl overflow-hidden shadow-xl group cursor-pointer"
            onClick={() => setModalVideo(video.src)}
            role="button"
            aria-label={`Play video: ${video.title}`}
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setModalVideo(video.src)}
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
                <FaPlay className="text-white text-2xl" aria-hidden />
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
            role="dialog"
            aria-modal="true"
            aria-label="Video modal"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-3xl p-4"
            >
              <button
                onClick={() => setModalVideo(null)}
                className="absolute top-2 right-2 text-white text-xl"
                aria-label="Close video"
              >
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

/* ── Newsletter ── */
function NewsletterCTA(): React.JSX.Element {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">(
    "idle"
  );

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
    <section className="max-w-6xl mx-auto mt-12 px-6" aria-labelledby="newsletter-title">
      <div className="bg-orange-500 rounded-2xl px-8 py-10 md:px-12 md:py-12 text-center shadow-lg">
        <h2 id="newsletter-title" className="text-white text-2xl md:text-3xl font-bold leading-snug">
          Be the first to know about the latest deals,
          <br className="hidden md:block" /> receive new trending recipes &amp; more!
        </h2>

        <form
          onSubmit={submit}
          className="mt-7 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center"
          noValidate
        >
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

/* ── Page (logique client) ── */
export default function HomeClient(): React.JSX.Element {
  const TAKE = 9;
  const params = useSearchParams();
  const router = useRouter();

  // 👉 URL = source de vérité
  const q = params.get("q") ?? "";
  const page = Math.max(1, Number(params.get("page") ?? "1") || 1);

  const [pageCount, setPageCount] = React.useState(1);
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const ctrl = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);

      const url = new URL(apiPath("/api/recipes"), window.location.origin);
      url.searchParams.set("page", String(page));
      url.searchParams.set("take", String(TAKE));
      if (q.trim()) url.searchParams.set("q", q.trim());

      try {
        const res = await fetch(url.toString(), {
          cache: "no-store",
          credentials: "include",
          signal: ctrl.signal,
        });

        // Fallback si l'API paginée n'est pas dispo
        if (!res.ok) {
          const res2 = await fetch(apiPath("/api/recipes"), {
            cache: "no-store",
            signal: ctrl.signal,
          });
          const data2: RecipesResponse = await res2.json();
          const list = Array.isArray(data2) ? data2 : data2.items;
          const total = list.length;
          const pc = Math.max(1, Math.ceil(total / TAKE));
          setPageCount(pc);
          const start = (page - 1) * TAKE;
          setRecipes(list.slice(start, start + TAKE));
          return;
        }

        const data: RecipesResponse = await res.json();
        if (Array.isArray(data)) {
          const total = data.length;
          const pc = Math.max(1, Math.ceil(total / TAKE));
          setPageCount(pc);
          const start = (page - 1) * TAKE;
          setRecipes(data.slice(start, start + TAKE));
        } else {
          setRecipes(data.items);
          setPageCount(Math.max(1, data.pageCount));
        }
      } catch (e) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((e as any)?.name === "AbortError") return;
        setError("Erreur de chargement des recettes.");
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    }

    void load();
    return () => ctrl.abort();

    // 🔑 recharge dès que l’URL change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.toString(), q, page]);

  // Pagination → écrit seulement dans l’URL
  const onPageChange = React.useCallback(
    (next: number) => {
      const sp = new URLSearchParams(Array.from(params.entries()));
      sp.set("page", String(Math.max(1, next)));
      router.replace(`?${sp.toString()}`);
      // pas de setState local : l'effet au-dessus relira l'URL et rechargera
    },
    [params, router]
  );

  return (
    <div>
      <Banner />
      <SearchBar />

      <div className="container mx-auto py-10">
        <div className="flex flex-col lg:flex-row gap-6 mt-6 max-w-7xl mx-auto">
          <Sidebar />

          <div className="flex-1">
            {loading && (
              <div className="text-center text-gray-500 text-lg py-10">Loading…</div>
            )}
            {error && (
              <div className="text-center text-red-500 text-lg py-10">{error}</div>
            )}

            {!loading && !error && recipes.length === 0 && (
              <div className="text-center text-gray-500 text-lg py-10">
                No recipes found.
              </div>
            )}

            {!loading && !error && recipes.length > 0 && (
              <>
                <section
                  aria-label="Recipes list"
                  className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6"
                >
                  {recipes.map((recipe) => (
                    <Link
                      key={recipe.id}
                      href={`/recipes/${recipe.slug}`}
                      className="block"
                      aria-label={`Open recipe: ${recipe.title}`}
                    >
                      <article className="relative bg-white shadow rounded-lg overflow-hidden hover:bg-gray-100">
                        <div className="relative aspect-[4/3]">
                          <Image
                            src={recipe.imageUrl ?? "/images/placeholder.jpg"}
                            alt={`Photo of ${recipe.title}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 300px"
                            priority
                          />
                          <LikeButton
                            recipeSlug={recipe.slug}
                            className="absolute top-2 right-2"
                          />
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
                </section>

                <Pagination
                  currentPage={page}
                  totalPages={pageCount}
                  onPageChange={onPageChange}
                />
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
