"use client";

import React from "react";
import Link from "next/link";
import type { AdminRecipeList } from "@/lib/types/admin";

type Status = "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";

const qs = (p: Record<string, string | number | undefined>) =>
  Object.entries(p)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");

export default function AdminRecipesClient() {
  const [page, setPage] = React.useState(1);
  const [take] = React.useState(20);
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState<Status | "">("PENDING");

  const [data, setData] = React.useState<AdminRecipeList | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<number[]>([]);

  const load = React.useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const query = qs({ page, take, q, status: status || undefined });
      const res = await fetch(`/api/admin/recipes?${query}`, {
        cache: "no-store",
        credentials: "include", // ⬅️ important : envoie le cookie (is admin)
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`load failed (${res.status}) ${text}`);
      }
      const json: AdminRecipeList = await res.json();
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur de chargement");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [page, take, q, status]);

  React.useEffect(() => {
    void load();
  }, [load]);

  async function doApprove(ids: number[]) {
    for (const id of ids) {
      const res = await fetch(`/api/admin/recipes/${id}/approve`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`approve failed for #${id} (${res.status}) ${text}`);
      }
    }
  }

  async function doReject(ids: number[]) {
    const reason = window.prompt("Motif du rejet (optionnel) :")?.trim() ?? "";
    for (const id of ids) {
      const res = await fetch(`/api/admin/recipes/${id}/reject`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`reject failed for #${id} (${res.status}) ${text}`);
      }
    }
  }

  async function doDelete(ids: number[]) {
    if (!confirm(`Supprimer (soft delete) ${ids.length} recette(s) ?`)) return;
    for (const id of ids) {
      const res = await fetch(`/api/admin/recipes/${id}/delete`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`delete failed for #${id} (${res.status}) ${text}`);
      }
    }
  }

  const action = async (kind: "approve" | "reject" | "delete", ids: number[]) => {
    try {
      if (kind === "approve") await doApprove(ids);
      if (kind === "reject") await doReject(ids);
      if (kind === "delete") await doDelete(ids);
      setSelected([]);
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl text-black font-semibold">Recipes moderation</h2>

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title/description"
          className="border text-black rounded px-3 py-2"
        />
        <select
          value={status}
          onChange={(e) => setStatus((e.target.value || "") as Status | "")}
          className="border text-black rounded px-3 py-2"
        >
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="DRAFT">Draft</option>
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
      </div>

      <div className="flex gap-2">
        <button
          disabled={selected.length === 0}
          onClick={() => void action("approve", selected)}
          className="px-3 py-2 bg-green-600 text-white rounded disabled:opacity-50"
        >
          Approve
        </button>
        <button
          disabled={selected.length === 0}
          onClick={() => void action("reject", selected)}
          className="px-3 py-2 bg-yellow-500 text-white rounded disabled:opacity-50"
        >
          Reject
        </button>
        <button
          disabled={selected.length === 0}
          onClick={() => void action("delete", selected)}
          className="px-3 py-2 bg-red-600 text-white rounded disabled:opacity-50"
        >
          Delete
        </button>
      </div>

      {loading && <p className="text-gray-500">Loading…</p>}
      {err && <p className="text-red-600">{err}</p>}

      {!loading && data && (
        <>
          <table className="w-full text-sm border bg-white">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2">
                  <input
                    type="checkbox"
                    checked={data.items.length > 0 && selected.length === data.items.length}
                    onChange={(e) =>
                      setSelected(e.target.checked ? data.items.map((r) => r.id) : [])
                    }
                  />
                </th>
                <th className="p-2 text-black text-left">Title</th>
                <th className="p-2 text-black text-left">Author</th>
                <th className="p-2 text-black text-left">Status</th>
                <th className="p-2 text-black text-left">Created</th>
                <th className="p-2 text-black text-left">Link</th>
                <th className="p-2 text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2 align-top">
                    <input
                      type="checkbox"
                      checked={selected.includes(r.id)}
                      onChange={(e) =>
                        setSelected((prev) =>
                          e.target.checked ? [...prev, r.id] : prev.filter((id) => id !== r.id)
                        )
                      }
                    />
                  </td>
                  <td className="p-2 text-black align-top">
                    <div className="font-medium">{r.title}</div>
                    {r.status === "REJECTED" && r.rejectionReason && (
                      <p className="mt-1 text-xs text-red-700">
                        Motif : {r.rejectionReason}
                      </p>
                    )}
                  </td>
                  <td className="p-2 text-black align-top">
                    {r.author.name ?? r.author.email}
                  </td>
                  <td className="p-2 text-black align-top">{r.status}</td>
                  <td className="p-2 align-top text-gray-500">
                    {new Date(r.createdAt).toLocaleString()}
                  </td>
                  <td className="p-2 text-black align-top">
                    {r.slug ? (
                      <Link className="text-blue-600 underline" href={`/recipes/${r.slug}`}>
                        Open
                      </Link>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="p-2 align-top flex gap-2">
                    <button
                      className="px-2 py-1 bg-green-600 text-white rounded"
                      onClick={() => void action("approve", [r.id])}
                    >
                      Approve
                    </button>
                    <button
                      className="px-2 py-1 bg-yellow-500 text-white rounded"
                      onClick={() => void action("reject", [r.id])}
                    >
                      Reject
                    </button>
                    <button
                      className="px-2 py-1 bg-red-600 text-white rounded"
                      onClick={() => void action("delete", [r.id])}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {data.items.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-gray-500" colSpan={7}>
                    No recipes
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <div className="flex items-center justify-between mt-4">
            <span className="text-sm text-gray-600">
              Page {data.page} / {data.pageCount} — {data.total} recipes
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
