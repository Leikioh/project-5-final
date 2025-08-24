"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Recipes", href: "/recipes" },
  { name: "Search", href: "/search" },
  { name: "Contact", href: "/contact" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  // refs pour chaque item
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const containerRef = useRef<HTMLUListElement | null>(null);

  // position et largeur de l’underline
  const [underline, setUnderline] = useState({ x: 0, w: 0 });

  // calcule l’index actif en fonction du pathname
  const activeIndex = (() => {
    if (pathname === "/") return 0;
    const i = navItems.findIndex((n) => n.href !== "/" && pathname.startsWith(n.href));
    return i === -1 ? 0 : i;
  })();

  // met à jour la position/largeur de l’underline quand la route ou la taille change
  useEffect(() => {
    const update = () => {
      const li = itemRefs.current[activeIndex];
      const ul = containerRef.current;
      if (!li || !ul) return;

      const liRect = li.getBoundingClientRect();
      const ulRect = ul.getBoundingClientRect();
      setUnderline({ x: liRect.left - ulRect.left, w: liRect.width });
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [activeIndex, pathname]);

  return (
    <header className="bg-white fixed top-0 w-full z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <nav className="relative">
          <ul
            ref={containerRef}
            className="flex items-center gap-8 relative"
          >
            {/* Underline unique, positionnée globalement */}
            <motion.div
              className="absolute bottom-0 h-1 bg-orange-500 rounded-full"
              animate={{ x: underline.x, width: underline.w }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            />
            {navItems.map((item, idx) => {
              const isActive = idx === activeIndex;
              return (
                <li
                  key={item.href}
                  ref={(el) => {itemRefs.current[idx] = el;}}
                  className={`relative px-1 py-2 ${
                    isActive ? "text-orange-500 font-bold" : "text-gray-700 hover:text-orange-500"
                  }`}
                >
                  <Link href={item.href}>{item.name}</Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="hidden md:flex gap-4 items-center">
          {!isAuthenticated ? (
            <>
              <Link href="/auth/sign-in" className="text-gray-500 px-4 py-2 rounded-lg hover:text-orange-500">
                Sign In
              </Link>
              <Link href="/auth/register" className="bg-orange-500 px-4 py-2 rounded-lg text-white hover:shadow-lg">
                Sign Up
              </Link>
            </>
          ) : (
            <>
              <span className="text-gray-800 font-semibold">
                Hello, {user?.name ?? user?.email}
              </span>
              <button
                onClick={logout}
                className="text-gray-500 px-4 py-2 rounded-lg hover:text-orange-500"
              >
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
