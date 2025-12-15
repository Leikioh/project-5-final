"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import LikeButton from "@/components/LikeButton";
import { apiPath } from "@/lib/api";
import Footer from "@/components/Footer";

type Recipe = {
  id: number;
  title: string;
  imageUrl: string | null;
  author: { id: number; name: string | null };
  slug: string;
};

type PagedResponse = {
  items: Recipe[];
  total: number;
  page: number;
  pageCount: number;
};

type RecipesResponse = PagedResponse | Recipe[];

/* ── SearchBar instantanée (debounce 300 ms) ── */
function SearchBarInstant({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="max-w-5xl mx-auto px-4 mb-12 mt-10">
      <div className="border border-gray-200 rounded-lg flex items-center px-4 py-3 shadow-sm">
        <label htmlFor="search-q" className="sr-only">
          Search for recipes
        </label>
        <input
          id="search-q"
          type="search"
          placeholder="Search for recipes..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-500"
          aria-label="Search recipes"
          inputMode="search"
        />
      </div>
    </div>
  );
}

export default function SearchPage(): React.JSX.Element {
  const TAKE = 12;

  // Saisie utilisateur + version "debounced"
  const [query, setQuery] = React.useState("");
  const [debouncedQ, setDebouncedQ] = React.useState("");

  React.useEffect(() => {
    const id = window.setTimeout(() => setDebouncedQ(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  // Données + états
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(true);
  const [loadingInitial, setLoadingInitial] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const loading = loadingInitial || loadingMore;
  const [error, setError] = React.useState<string | null>(null);

  // Abort uniquement pour les chargements initiaux
  const initialAbortRef = React.useRef<AbortController | null>(null);

  // Garde-fou: empêche plusieurs “load more” simultanés
  const isFetchingMoreRef = React.useRef(false);

  const loadPage = React.useCallback(
    async (p: number, q: string, append: boolean) => {
      if (append) {
        if (isFetchingMoreRef.current) return; // déjà en cours
        isFetchingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        // annule le précédent initial si existant
        if (initialAbortRef.current) initialAbortRef.current.abort();
        initialAbortRef.current = new AbortController();
        setLoadingInitial(true);
      }

      setError(null);

      try {
        const ctrl = append ? undefined : initialAbortRef.current!;
        const url = new URL(apiPath("/api/recipes"), window.location.origin);
        url.searchParams.set("page", String(p));
        url.searchParams.set("take", String(TAKE));
        if (q) url.searchParams.set("q", q);

        const res = await fetch(url.toString(), {
          cache: "no-store",
          signal: ctrl?.signal,
        });

        if (!res.ok) {
          let msg = `Erreur ${res.status}`;
          try {
            const j = await res.json();
            msg = j?.error || j?.message || msg;
          } catch {}
          setError(msg);
          if (!append) setRecipes([]);
          setHasMore(false);
          return;
        }

        const data: RecipesResponse = await res.json();

        if (Array.isArray(data)) {
          // Fallback non paginé → simuler la pagination côté client
          const source = q
            ? data.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()))
            : data;

          const start = (p - 1) * TAKE;
          const slice = source.slice(start, start + TAKE);
          setHasMore(start + TAKE < source.length);

          setRecipes((prev) => {
            const merged = append ? [...prev, ...slice] : slice;
            const map = new Map<number, Recipe>();
            for (const r of merged) map.set(r.id, r);
            return Array.from(map.values());
          });
        } else {
          const { items, pageCount } = data;
          setHasMore(p < pageCount && items.length > 0);

          setRecipes((prev) => {
            const merged = append ? [...prev, ...items] : items;
            const map = new Map<number, Recipe>();
            for (const r of merged) map.set(r.id, r);
            return Array.from(map.values());
          });
        }
      } catch (e) {
        // Abort d’un initial load: on ignore
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!append && (e as any)?.name === "AbortError") return;
        setError("Erreur de chargement des recettes.");
        if (!append) setRecipes([]);
        setHasMore(false);
      } finally {
        if (append) {
          isFetchingMoreRef.current = false;
          setLoadingMore(false);
        } else {
          setLoadingInitial(false);
        }
      }
    },
    [TAKE]
  );

  // Nouvelle recherche → reset et charge page 1
  React.useEffect(() => {
    setPage(1);
    setHasMore(true);
    setRecipes([]);
    void loadPage(1, debouncedQ, false);
  }, [debouncedQ, loadPage]);

  // Infinite scroll
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loadingMore && !loadingInitial) {
          const next = page + 1;
          setPage(next);
          void loadPage(next, debouncedQ, true);
        }
      },
      { rootMargin: "500px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [page, hasMore, loadingMore, loadingInitial, debouncedQ, loadPage]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="text-center mb-6 mt-20">
        <h1 className="text-4xl font-bold text-gray-800">Search Recipes</h1>
        <p className="text-gray-500 mt-2">Find your next favorite meal</p>
      </div>

      <SearchBarInstant value={query} onChange={setQuery} />

      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && recipes.length === 0 && (
        <p className="text-center text-gray-500">
          {debouncedQ ? `No results for “${debouncedQ}”.` : "No recipes available."}
        </p>
      )}

      {recipes.length > 0 && (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => (
            <Link
              key={r.id}
              href={`/recipes/${r.slug}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden block"
            >
              <div className="relative h-48">
                <Image
                  src={r.imageUrl ?? "/images/placeholder.jpg"}
                  alt={r.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 33vw"
                  priority
                />
                <LikeButton
                  recipeSlug={r.slug}
                  className="absolute top-2 right-2 z-10"
                />
              </div>

              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-800">{r.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  by {r.author?.name ?? "Anonyme"}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Sentinel pour l'infinite scroll */}
      <div ref={sentinelRef} className="h-12 flex items-center justify-center">
        {loading && <span className="text-gray-500">Loading…</span>}
        {!hasMore && recipes.length > 0 && (
          <span className="text-gray-400 text-sm">No more results</span>
        )}
      </div>

      <Footer />
    </main>
  );
}
