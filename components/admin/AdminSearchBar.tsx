"use client";
import * as React from "react";

type SearchItem = {
  id: number | string;
  title: string;
  slug: string | null;
  updatedAt: string;
};

type ApiSuccess = { ok: true; count: number; results: SearchItem[] };
type ApiError = { error: string; detail?: string };

// ---- Type guard pour discriminer ApiSuccess ----
function isApiSuccess(data: unknown): data is ApiSuccess {
  return (
    typeof data === "object" &&
    data !== null &&
    "ok" in data &&
    (data as { ok: unknown }).ok === true &&
    "results" in data &&
    Array.isArray((data as { results: unknown }).results)
  );
}

export default function AdminSearchBar(): React.JSX.Element {
  const [q, setQ] = React.useState<string>("");
  const [loading, setLoading] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<SearchItem[]>([]);

  React.useEffect(() => {
    const query = q.trim();
    if (!query) {
      setItems([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });

        const data: unknown = await res.json();

        // Cas HTTP non 2xx → on extrait le message d’erreur si présent
        if (!res.ok) {
          const msg =
            typeof data === "object" &&
            data !== null &&
            "error" in data
              ? (data as ApiError).detail
                ? `${(data as ApiError).error}: ${(data as ApiError).detail}`
                : (data as ApiError).error
              : "Erreur";
          setError(msg);
          setItems([]);
          return;
        }

        // Cas 2xx → on vérifie la forme du succès
        if (isApiSuccess(data)) {
          setItems(data.results);
        } else {
          // Le body n’est pas au format succès → on tente d’extraire une erreur structurée
          const err =
            typeof data === "object" && data !== null && "error" in data
              ? (data as ApiError)
              : { error: "Réponse inattendue du serveur" };
          setError(err.detail ? `${err.error}: ${err.detail}` : err.error);
          setItems([]);
        }
      } catch (e: unknown) {
        if (e instanceof DOMException && e.name === "AbortError") return;
        const msg = e instanceof Error ? e.message : "Erreur réseau";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [q]);

  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Rechercher une recette (titre, description, slug)…"
        className="w-full rounded-xl border px-3 py-2"
        maxLength={100}
        aria-label="Rechercher"
      />
      {loading && <div>Recherche…</div>}
      {error && <div className="text-red-600">Erreur: {error}</div>}
      {!loading && !error && items.length === 0 && q.trim() && (
        <div>Aucun résultat.</div>
      )}
      <ul className="divide-y rounded-xl border">
        {items.map((it) => (
          <li key={String(it.id)} className="p-3">
            <div className="font-medium">{it.title}</div>
            <div className="text-sm text-gray-500">/{it.slug ?? "—"}</div>
            <div className="text-xs text-gray-400">
              {new Date(it.updatedAt).toLocaleString()}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
