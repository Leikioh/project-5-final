"use client";
import React from "react";

type Item = {
  id: number; title: string; slug: string; status: "PENDING"|"APPROVED"|"REJECTED";
  author?: { id: number; name: string | null; email: string };
};

export default function AdminRecipesPage() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const [status, setStatus] = React.useState<string>(""); // filtre
  const [q, setQ] = React.useState("");

  const load = React.useCallback(async () => {
    const url = new URL("/api/admin/recipes", window.location.origin);
    url.searchParams.set("page", String(page));
    if (status) url.searchParams.set("status", status);
    if (q.trim()) url.searchParams.set("q", q.trim());
    const res = await fetch(url.toString(), { credentials: "include", cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setPageCount(data.pageCount);
    }
  }, [page, status, q]);

  React.useEffect(() => { void load(); }, [load]);

  const act = async (id: number, action: "approve"|"reject"|"delete") => {
    const method = action === "delete" ? "DELETE" : "POST";
    const endpoint = action === "delete"
      ? `/api/admin/recipes/${id}/delete`
      : `/api/admin/recipes/${id}/${action}`;
    const res = await fetch(endpoint, { method, credentials: "include" });
    if (res.ok) void load();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Modération des recettes</h2>

      <div className="flex gap-2 mb-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Recherche…" className="border p-2 rounded"/>
        <select value={status} onChange={(e)=>setStatus(e.target.value)} className="border p-2 rounded">
          <option value="">Tous statuts</option>
          <option value="PENDING">En attente</option>
          <option value="APPROVED">Approuvées</option>
          <option value="REJECTED">Refusées</option>
        </select>
        <button onClick={()=>{setPage(1); void load();}} className="px-3 py-2 bg-slate-800 text-white rounded">Filtrer</button>
      </div>

      <div className="overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="p-3">Titre</th>
              <th className="p-3">Auteur</th>
              <th className="p-3">Statut</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3"><a className="text-blue-600 hover:underline" href={`/recipes/${it.slug}`}>{it.title}</a></td>
                <td className="p-3">{it.author?.name ?? it.author?.email ?? "—"}</td>
                <td className="p-3">{it.status}</td>
                <td className="p-3 flex gap-2">
                  <button onClick={()=>act(it.id,"approve")} className="px-2 py-1 bg-green-600 text-white rounded">Approuver</button>
                  <button onClick={()=>act(it.id,"reject")} className="px-2 py-1 bg-yellow-600 text-white rounded">Refuser</button>
                  <button onClick={()=>act(it.id,"delete")} className="px-2 py-1 bg-red-600 text-white rounded">Supprimer</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td className="p-4 text-slate-500" colSpan={4}>Aucune recette.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex gap-2 justify-center mt-4">
        <button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 border rounded disabled:opacity-50">«</button>
        <span className="px-3 py-1">{page} / {pageCount}</span>
        <button disabled={page>=pageCount} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-50">»</button>
      </div>
    </div>
  );
}
