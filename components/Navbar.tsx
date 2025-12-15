"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { FaBars, FaTimes } from "react-icons/fa";
import { useAuth } from "@/app/context/AuthContext";

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { me, loading, isAdmin, logout } = useAuth();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const displayName =
    me?.name && me.name.trim().length > 0
      ? me.name
      : me?.email
      ? me.email.split("@")[0]
      : "";

  const isActive = (href: string) => {
    // Actif si le pathname commence par href (utile pour /recipes/slug)
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const NavItem = ({
    href,
    children,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    onClick?: () => void;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`text-sm transition-colors ${
          active
            ? "text-orange-600"
            : "text-black hover:text-orange-500"
        }`}
        aria-current={active ? "page" : undefined}
      >
        {children}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Liens gauche (desktop) */}
        <div className="hidden lg:flex items-center gap-6">
          <NavItem href="/">Home</NavItem>
          <NavItem href="/recipes">Recipes</NavItem>
          <NavItem href="/search">Search</NavItem>
          <NavItem href="/contact">Contact</NavItem>

          {/* Favoris (uniquement connecté) */}
          {!loading && me && <NavItem href="/favorites">Favoris</NavItem>}

          {/* Lien Admin (uniquement admin) */}
          {!loading && isAdmin && <NavItem href="/admin">Admin</NavItem>}
        </div>

        {/* Actions droite (desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          {loading ? (
            <span className="text-gray-500 text-sm">…</span>
          ) : me ? (
            <>
              {/* ➜ Créer une recette : visible si connecté */}
              <Link
                href="/recipes/new"
                className="px-3 py-2 rounded-md text-white bg-orange-500 hover:bg-orange-600"
                aria-label="Créer une recette"
              >
                Créer une recette
              </Link>

              <span className="text-sm text-gray-700">
                Hello, <span className="font-semibold">{displayName}</span>
              </span>
              <button
                onClick={async () => {
                  await logout();
                  router.refresh();
                }}
                className="px-3 py-2 rounded-md text-white bg-gray-900 hover:bg-black"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/auth/sign-in"
                className="px-4 py-2 rounded-md text-gray-800 hover:bg-gray-100"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>

        {/* Burger (mobile) */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100"
          aria-label="Open menu"
          aria-expanded={open}
        >
          {open ? <FaTimes /> : <FaBars />}
        </button>
      </nav>

      {/* Menu mobile */}
      {open && (
        <div className="lg:hidden border-t border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 grid gap-1">
            <NavItem href="/" onClick={() => setOpen(false)}>Home</NavItem>
            <NavItem href="/recipes" onClick={() => setOpen(false)}>Recipes</NavItem>
            <NavItem href="/search" onClick={() => setOpen(false)}>Search</NavItem>
            <NavItem href="/contact" onClick={() => setOpen(false)}>Contact</NavItem>

            {/* Favoris (mobile) */}
            {!loading && me && (
              <NavItem href="/favorites" onClick={() => setOpen(false)}>
                Favoris
              </NavItem>
            )}

            {/* Admin (mobile) */}
            {!loading && isAdmin && (
              <NavItem href="/admin" onClick={() => setOpen(false)}>
                Admin
              </NavItem>
            )}

            <div className="h-px bg-gray-100 my-1" />

            {loading ? (
              <span className="px-2 py-2 text-gray-500">…</span>
            ) : me ? (
              <>
                {/* ➜ Créer une recette (mobile) */}
                <Link
                  href="/recipes/new"
                  onClick={() => setOpen(false)}
                  className="px-2 py-2 rounded text-white bg-orange-500 hover:bg-orange-600"
                >
                  Créer une recette
                </Link>

                <span className="px-2 py-2 text-sm text-gray-700">
                  Hello, <span className="font-semibold">{displayName}</span>
                </span>
                <button
                  onClick={async () => {
                    await logout();
                    setOpen(false);
                    router.refresh();
                  }}
                  className="px-2 py-2 rounded text-left text-white bg-gray-900 hover:bg-black"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/sign-in"
                  onClick={() => setOpen(false)}
                  className="px-2 py-2 rounded text-black hover:bg-gray-100"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setOpen(false)}
                  className="px-2 py-2 rounded text-center bg-orange-500 text-white hover:bg-orange-600"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
