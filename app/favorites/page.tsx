// app/favorites/page.tsx
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { apiPath } from "@/lib/api";

type Recipe = {
  id: number;
  title: string;
  imageUrl: string | null;
  author: { id: number; name: string | null };
  slug: string;
};

type PagedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageCount: number;
};

async function getFavorites(page = 1): Promise<PagedResponse<Recipe>> {
  const cookieStore = cookies();
  // Passer les cookies au fetch pour conserver la session utilisateur
  const res = await fetch(`${apiPath}/favorites?page=${page}`, {
    headers: { cookie: cookieStore.toString() },
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to load favorites");
  return res.json();
}

export default async function FavoritesPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Number(searchParams?.page ?? "1") || 1;
  const data = await getFavorites(page);

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-6">Mes favoris</h1>

      {data.total === 0 ? (
        <div className="text-gray-600">
          <p>Vous n’avez encore liké aucune recette.</p>
          <p className="mt-2">
            Parcourez les{" "}
            <Link href="/recipes" className="underline">
              recettes
            </Link>{" "}
            et cliquez sur le cœur pour les ajouter ici.
          </p>
        </div>
      ) : (
        <>
          <ul className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((r) => (
              <li key={r.id} className="border rounded-xl overflow-hidden hover:shadow-sm transition">
                <Link href={`/recipes/${r.slug}`} className="block">
                  <div className="aspect-[4/3] bg-gray-100 relative">
                    {r.imageUrl ? (
                      <Image
                        src={r.imageUrl}
                        alt={r.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Pas d’image
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-medium line-clamp-2">{r.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Par {r.author?.name ?? "Anonyme"}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {/* Pagination simple */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href={`/favorites?page=${Math.max(1, page - 1)}`}
              aria-disabled={page <= 1}
              className={`px-3 py-2 rounded border ${page <= 1 ? "opacity-40 pointer-events-none" : ""}`}
            >
              Précédent
            </Link>
            <span className="text-sm text-gray-600">
              Page {data.page} / {data.pageCount || 1}
            </span>
            <Link
              href={`/favorites?page=${Math.min(data.pageCount || 1, page + 1)}`}
              aria-disabled={page >= (data.pageCount || 1)}
              className={`px-3 py-2 rounded border ${page >= (data.pageCount || 1) ? "opacity-40 pointer-events-none" : ""}`}
            >
              Suivant
            </Link>
          </div>
        </>
      )}
    </main>
  );
}
