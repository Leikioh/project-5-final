"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { FaSearch } from "react-icons/fa";
import LikeButton from "@/components/LikeButton";
import { apiPath } from "@/lib/api";

/* ── Types ─────────────────────────────────────────────────────────────── */

type Recipe = {
  id: number;
  title: string;
  imageUrl: string | null;
  author: { id: number; name: string | null };
};

type PagedResponse = {
  items: Recipe[];
  total: number;
  page: number;
  pageCount: number;
};

type RecipesResponse = PagedResponse | Recipe[];

/* ── UI ────────────────────────────────────────────────────────────────── */

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
    <div className="max-w-5xl mx-auto px-4 mb-12 mt-10">
      <div className="bg-[#fef7f7] border border-gray-200 rounded-lg flex items-center px-4 py-3 shadow-sm">
        <FaSearch className="text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Search for recipes..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSubmit();
          }}
          className="flex-1 outline-none bg-transparent text-gray-800 placeholder-gray-500"
        />
        <button
          onClick={onSubmit}
          className="ml-3 px-4 py-2 rounded-md bg-orange-500 text-white font-medium"
        >
          Search
        </button>
      </div>
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

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function SearchPage() {
  const TAKE = 12;

  // query + pagination
  const [query, setQuery] = React.useState("");
  const lastQueryRef = React.useRef("");
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);

  // data state
  const [recipes, setRecipes] = React.useState<Recipe[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(
    async (p: number, q: string) => {
      setLoading(true);
      setError(null);

      // Essaye la pagination serveur
      const url = new URL(apiPath("/api/recipes"), window.location.origin);
      url.searchParams.set("page", String(p));
      url.searchParams.set("take", String(TAKE));
      if (q.trim()) url.searchParams.set("q", q.trim());

      try {
        const res = await fetch(url.toString(), { cache: "no-store", credentials: "include" });
        if (!res.ok) {
          // Fallback: le backend renvoie un tableau → filtre + slice côté client
          const res2 = await fetch(apiPath("/api/recipes"), { cache: "no-store" });
          if (!res2.ok) {
            setRecipes([]);
            setPageCount(1);
            setError("Erreur de chargement des recettes.");
            return;
          }
          const data2: RecipesResponse = await res2.json();
          const arr = Array.isArray(data2) ? data2 : data2.items;
          const filtered = q.trim()
            ? arr.filter((r) => r.title.toLowerCase().includes(q.trim().toLowerCase()))
            : arr;
          const total = filtered.length;
          const pc = Math.max(1, Math.ceil(total / TAKE));
          setPageCount(pc);
          const start = (p - 1) * TAKE;
          setRecipes(filtered.slice(start, start + TAKE));
          return;
        }

        const data: RecipesResponse = await res.json();
        if (Array.isArray(data)) {
          // Fallback tableau + filtre client
          const filtered = lastQueryRef.current
            ? data.filter((r) => r.title.toLowerCase().includes(lastQueryRef.current.toLowerCase()))
            : data;
          const total = filtered.length;
          const pc = Math.max(1, Math.ceil(total / TAKE));
          setPageCount(pc);
          const start = (p - 1) * TAKE;
          setRecipes(filtered.slice(start, start + TAKE));
        } else {
          // Réponse paginée
          setRecipes(data.items);
          setPageCount(Math.max(1, data.pageCount));
        }
      } catch {
        setError("Erreur de chargement des recettes.");
        setRecipes([]);
        setPageCount(1);
      } finally {
        setLoading(false);
      }
    },
    [TAKE]
  );

  // chargement initial + changement de page
  React.useEffect(() => {
    void load(page, lastQueryRef.current);
  }, [page, load]);

  const triggerSearch = React.useCallback(() => {
    lastQueryRef.current = query;
    setPage(1);
    void load(1, query);
  }, [query, load]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      
      <div className="text-center mb-6 mt-20">
        <h1 className="text-4xl font-bold text-gray-800">Search Recipes</h1>
        <p className="text-gray-500 mt-2">Find your next favorite meal</p>
      </div>

      <SearchBar value={query} onChange={setQuery} onSubmit={triggerSearch} />

      {loading && <p className="text-center text-gray-500">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {!loading && !error && recipes.length === 0 && (
        <p className="text-center text-gray-500">
          {lastQueryRef.current ? `No results for “${lastQueryRef.current}”.` : "No recipes available."}
        </p>
      )}

      {!loading && !error && recipes.length > 0 && (
        <>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recipes.map((r) => (
              <Link
                key={r.id}
                href={`/recipes/${r.id}`}
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
                  {/* Le LikeButton stoppe la propagation dans son onClick */}
                  <LikeButton recipeId={r.id} className="absolute top-2 right-2 z-10" />
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

          <Pagination page={page} pageCount={pageCount} onChange={setPage} />
        </>
      )}
    </main>
  );
}
