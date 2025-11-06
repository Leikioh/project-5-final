"use client";

import React from "react";
import Link from "next/link";
import type { AdminCommentList } from "@/lib/types/admin";

const buildApiUrl = (path: string, params?: Record<string, string | number | undefined>) => {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim() !== ""
      ? process.env.NEXT_PUBLIC_SITE_URL
      : typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000";
  const url = new URL(path.startsWith("/") ? path : `/${path}`, base);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
    });
  }
  return url.toString();
};

export default function AdminCommentsClient() {
  const [page, setPage] = React.useState(1);
  const [take] = React.useState(20);
  const [q, setQ] = React.useState("");
  const [visibility, setVisibility] = React.useState<"all" | "hidden" | "visible">("all");

  const [data, setData] = React.useState<AdminCommentList | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<number[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const url = buildApiUrl("/api/admin/comments", { page, take, q, visibility });
      const res = await fetch(url, {
        cache: "no-store",
        credentials: "include",
      });

      // Gestion dédiée 401/403 pour comprendre immédiatement le souci
      if (res.status === 401 || res.status === 403) {
        const msg = await res.text().catch(() => "");
        throw new Error(
          `Accès refusé (${res.status}). ` +
            (msg || "Vous devez être connecté avec un compte admin (cookies requis).")
        );
      }

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`Échec du chargement (${res.status}) ${text}`);
      }

      const json: AdminCommentList = await res.json();
      setData(json);
    } catch (e) {
      console.error("[AdminComments] load error:", e);
      setErr(e instanceof Error ? e.message : "Erreur de chargement");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, take, q, visibility]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const act = async (kind: "hide" | "unhide" | "delete", ids: number[]) => {
    try {
      for (const id of ids) {
        const url = buildApiUrl(`/api/admin/comments/${id}/${kind}`);
        const res = await fetch(url, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });

        if (res.status === 401 || res.status === 403) {
          const msg = await res.text().catch(() => "");
          throw new Error(
            `${kind} interdit (${res.status}) ${msg || "Requis: compte admin + cookies."}`
          );
        }

        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`${kind} failed for #${id} (${res.status}) ${text}`);
        }
      }
      setSelected([]);
      await load();
    } catch (e) {
      console.error("[AdminComments] action error:", e);
      alert(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl text-black font-semibold">Comments moderation</h2>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search (content, author, recipe)"
          className="border text-black rounded px-3 py-2"
        />
        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value as "all" | "hidden" | "visible")}
          className="border text-black rounded px-3 py-2"
        >
          <option value="all">All</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        <button
          onClick={() => {
            setPage(1);
            void load();
          }}
          className="px-3 py-2 text-black bg-gray-200 rounded"
        >
          Filter
        </button>
        {err && (
          <button
            onClick={() => void load()}
            className="px-3 py-2 text-white bg-black rounded"
          >
            Retry
          </button>
        )}
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}
      {err && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {err.includes("Accès refusé") ? (
            <>
              <p>{err}</p>
              <p className="mt-2">
                <Link href="/auth/sign-in" className="text-red-800 underline">
                  Se connecter
                </Link>
              </p>
            </>
          ) : (
            <p>{err}</p>
          )}
        </div>
      )}

      {!loading && data && (
        <>
          <div className="flex gap-2">
            <button
              disabled={selected.length === 0}
              onClick={() => void act("hide", selected)}
              className="px-3 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
            >
              Hide
            </button>
            <button
              disabled={selected.length === 0}
              onClick={() => void act("unhide", selected)}
              className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50"
            >
              Unhide
            </button>
            <button
              disabled={selected.length === 0}
              onClick={() => void act("delete", selected)}
              className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50"
            >
              Delete
            </button>
          </div>

          <table className="w-full text-black text-sm border mt-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2">
                  <input
                    type="checkbox"
                    checked={data.items.length > 0 && selected.length === data.items.length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? data.items.map((c) => c.id) : [])
                    }
                  />
                </th>
                <th className="p-2 text-left">Comment</th>
                <th className="p-2 text-left">Recipe</th>
                <th className="p-2 text-left">Author</th>
                <th className="p-2">Hidden</th>
                <th className="p-2">Created</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-2 align-top">
                    <input
                      type="checkbox"
                      checked={selected.includes(c.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked ? [...prev, c.id] : prev.filter((id) => id !== c.id)
                        )
                      }
                    />
                  </td>
                  <td className="p-2 align-top max-w-[360px]">
                    <div className="line-clamp-3">{c.content}</div>
                  </td>
                  <td className="p-2 align-top">
                    <Link
                      className="text-blue-600 underline"
                      href={`/recipes/${c.recipe.slug ?? c.recipe.id}`}
                    >
                      {c.recipe.title}
                    </Link>
                  </td>
                  <td className="p-2 align-top">{c.author.name ?? c.author.email}</td>
                  <td className="p-2 align-top text-center">{c.hidden ? "Yes" : "No"}</td>
                  <td className="p-2 align-top text-gray-500">
                    {new Date(c.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2 align-top flex gap-2">
                    {c.hidden ? (
                      <button
                        className="px-2 py-1 bg-green-600 text-white rounded"
                        onClick={() => void act("unhide", [c.id])}
                      >
                        Unhide
                      </button>
                    ) : (
                      <button
                        className="px-2 py-1 bg-yellow-500 text-white rounded"
                        onClick={() => void act("hide", [c.id])}
                      >
                        Hide
                      </button>
                    )}
                    <button
                      className="px-2 py-1 bg-red-600 text-white rounded"
                      onClick={() => void act("delete", [c.id])}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={7}>
                    No comments
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">
              Page {data.page} / {data.pageCount} — {data.total} comments
            </span>
            <div className="flex gap-2">
              <button
                disabled={data.page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Prev
              </button>
              <button
                disabled={data.page === data.pageCount}
                onClick={() => setPage((p) => Math.min(data.pageCount, p + 1))}
                className="px-3 py-1 bg-gray-100 rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
