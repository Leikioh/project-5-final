// app/admin/page.tsx
import Link from "next/link";
import { cookies, headers } from "next/headers";

/* ───────── Types from the API ───────── */

type LatestPending = {
  id: number;
  title: string;
  slug: string;
  createdAt: string; // ISO string
};

type AdminStats = {
  usersTotal: number;
  recipesTotal: number;
  recipesPending: number;
  recipesApproved: number;
  recipesRejected: number;
  commentsTotal: number;
  commentsHidden: number;
  latestPending: LatestPending[];
};

/* ───────── Helper: fetch stats with session cookies ───────── */

async function fetchStatsWithSession() {
  // 1) Base absolue (http/https + host)
  const h = await headers();
  const host =
    h.get("x-forwarded-host") ??
    h.get("host") ??
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/^https?:\/\//, "") ??
    "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://") ? "https" : "http");
  const base = `${proto}://${host}`;

  // 2) Propager les cookies de session
  const jar = await cookies();
  const cookieHeader = jar.getAll().map((c) => `${c.name}=${encodeURIComponent(c.value)}`).join("; ");

  // 3) Appel de l'API admin en absolu
  const res = await fetch(`${base}/api/admin/stats`, {
    cache: "no-store",
    headers: { cookie: cookieHeader },
  });

  if (res.status === 403) {
    throw new Error("Accès refusé : vous devez être connecté avec un compte admin.");
  }
  if (!res.ok) {
    throw new Error("Impossible de charger les statistiques.");
  }
  return (await res.json()) as AdminStats;
}

/* ───────── Page (server component) ───────── */

export default async function AdminHomePage() {
  let stats: AdminStats | null = null;
  let error: string | null = null;

  try {
    stats = await fetchStatsWithSession();
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur inattendue.";
  }

  // Always return JSX to satisfy Next's requirement
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Administration</h1>
        <p className="text-gray-600">Modérez les recettes et commentaires de la plateforme.</p>
      </header>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-red-700">{error}</p>
          <p className="mt-3">
            <Link href="/auth/sign-in" className="text-orange-600 underline">
              Se connecter
            </Link>
          </p>
        </div>
      )}

      {!error && !stats && <p className="text-gray-500">Chargement…</p>}

      {!error && stats && (
        <>
          {/* Stat cards */}
          <section
            aria-label="Statistiques"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10"
          >
            {[
              { label: "Utilisateurs", value: stats.usersTotal, href: undefined, aria: "Nombre total d'utilisateurs" },
              { label: "Recettes (total)", value: stats.recipesTotal, href: "/admin/recipes", aria: "Nombre total de recettes" },
              { label: "En attente", value: stats.recipesPending, href: "/admin/recipes?status=PENDING", aria: "Recettes en attente de validation" },
              { label: "Publiées", value: stats.recipesApproved, href: "/admin/recipes?status=APPROVED", aria: "Recettes approuvées" },
              { label: "Refusées", value: stats.recipesRejected, href: "/admin/recipes?status=REJECTED", aria: "Recettes refusées" },
              { label: "Commentaires", value: stats.commentsTotal, href: "/admin/comments", aria: "Nombre total de commentaires" },
              { label: "Commentaires masqués", value: stats.commentsHidden, href: "/admin/comments?visibility=hidden", aria: "Nombre de commentaires masqués" },
            ].map((card) => {
              const content = (
                <div
                  className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow"
                  aria-label={card.aria}
                >
                  <p className="text-sm text-gray-500">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
              );
              return card.href ? (
                <Link
                  key={card.label}
                  href={card.href}
                  className="focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-lg"
                >
                  {content}
                </Link>
              ) : (
                <div key={card.label}>{content}</div>
              );
            })}
          </section>

          {/* Quick links */}
          <div className="mb-6 flex gap-3">
            <Link
              href="/admin/recipes"
              className="inline-flex items-center rounded-md bg-black px-4 py-2 text-white hover:bg-gray-900"
            >
              Gérer les recettes
            </Link>
            <Link
              href="/admin/comments"
              className="inline-flex items-center rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
            >
              Gérer les commentaires
            </Link>
          </div>

          {/* Latest pending */}
          <section className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Dernières recettes en attente</h2>
              <Link href="/admin/recipes?status=PENDING" className="text-orange-600 hover:underline">
                Voir tout
              </Link>
            </div>

            {stats.latestPending.length === 0 ? (
              <p className="text-gray-500">Aucune recette en attente 🎉</p>
            ) : (
              <ul className="divide-y divide-gray-200 rounded-lg border bg-white">
                {stats.latestPending.map((r) => (
                  <li key={r.id} className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium text-gray-900">{r.title}</p>
                      <p className="text-sm text-gray-500">
                        #{r.id} · {new Date(r.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/recipes/${r.slug}`}
                        className="rounded-md border px-3 py-1 text-sm hover:bg-gray-50"
                        aria-label={`Ouvrir la recette ${r.title}`}
                      >
                        Ouvrir
                      </Link>
                      <Link
                        href={`/admin/recipes?status=PENDING&focus=${r.id}`}
                        className="rounded-md bg-orange-500 px-3 py-1 text-sm text-white hover:bg-orange-600"
                        aria-label={`Modérer la recette ${r.title}`}
                      >
                        Modérer
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
