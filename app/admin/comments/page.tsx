"use client";
import React from "react";

type Item = {
  id: number; text: string; hidden: boolean;
  user?: { name: string|null; email: string };
  recipe?: { id: number; slug: string; title: string };
};

export default function AdminCommentsPage() {
  const [items, setItems] = React.useState<Item[]>([]);
  const [page, setPage] = React.useState(1);
  const [pageCount, setPageCount] = React.useState(1);
  const [q, setQ] = React.useState("");

  const load = React.useCallback( async () => {
    const url = new URL("/api/admin/comments", window.location.origin);
    url.searchParams.set("page", String(page));
    if (q.trim()) url.searchParams.set("q", q.trim());
    const res = await fetch(url.toString(), { credentials: "include", cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setPageCount(data.pageCount);
    }
  }, [page, q]);

  React.useEffect(() => { void load(); }, [load]);

  const act = async (id: number, action: "hide"|"unhide"|"delete") => {
    const method = action === "delete" ? "DELETE" : "POST";
    const endpoint = action === "delete" ? `/api/admin/comments/${id}/delete` : `/api/admin/comments/${id}/${action}`;
    const res = await fetch(endpoint, { method, credentials: "include" });
    if (res.ok) void load();
  };

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Modération des commentaires</h2>

      <div className="flex gap-2 mb-4">
        <input value={q} onChange={(e)=>setQ(e.target.value)} placeholder="Recherche…" className="border p-2 rounded"/>
        <button onClick={()=>{setPage(1); void load();}} className="px-3 py-2 bg-slate-800 text-white rounded">Filtrer</button>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left">
              <th className="p-3">Commentaire</th>
              <th className="p-3">Auteur</th>
              <th className="p-3">Recette</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-3">{it.hidden ? <span className="text-slate-400 italic">[masqué]</span> : it.text}</td>
                <td className="p-3">{it.user?.name ?? it.user?.email ?? "—"}</td>
                <td className="p-3">
                  {it.recipe ? <a className="text-blue-600 hover:underline" href={`/recipes/${it.recipe.slug}`}>{it.recipe.title}</a> : "—"}
                </td>
                <td className="p-3 flex gap-2">
                  {it.hidden ? (
                    <button onClick={()=>act(it.id,"unhide")} className="px-2 py-1 bg-green-600 text-white rounded">Afficher</button>
                  ) : (
                    <button onClick={()=>act(it.id,"hide")} className="px-2 py-1 bg-yellow-600 text-white rounded">Masquer</button>
                  )}
                  <button onClick={()=>act(it.id,"delete")} className="px-2 py-1 bg-red-600 text-white rounded">Supprimer</button>
                </td>
              </tr>
            ))}
            {items.length === 0 && <tr><td className="p-4 text-slate-500" colSpan={4}>Aucun commentaire.</td></tr>}
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
