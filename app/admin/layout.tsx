export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-bold text-lg">Admin • CookHub</h1>
          <nav className="flex gap-4 text-sm">
            <a className="hover:underline" href="/admin">Dashboard</a>
            <a className="hover:underline" href="/admin/recipes">Recettes</a>
            <a className="hover:underline" href="/admin/comments">Commentaires</a>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
