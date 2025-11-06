import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  robots: { index: false, follow: false, nocache: true },
  title: "Admin | CookHub",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="max-w-6xl mx-auto px-4 py-8">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl text-black font-bold">Admin</h1>
        <nav className="flex gap-3 text-sm">
          <Link className="px-3 py-1 roundedinline-flex items-center rounded-md bg-orange-500 text-white hover:bg-orange-600" href="/admin/recipes">
            Recipes
          </Link>
          <Link className="px-3 py-1 rounded inline-flex items-center  bg-black text-white hover:bg-gray-900" href="/admin/comments">
            Comments
          </Link>
        </nav>
      </header>
      {children}
    </section>
  );
}
