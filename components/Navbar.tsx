"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/app/context/AuthContext";

const navItems = [
  { name: "Home", href: "/" },
  { name: "Recipes", href: "/recipes" },   // corrigé de "/recipe" en "/recipes"
  { name: "Search", href: "/search" },
  { name: "Contact", href: "/contact" },
];

const Navbar: React.FC = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="bg-white fixed top-0 w-full z-50">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        <nav className="flex items-center gap-10">
          <ul
            className={`md:flex md:items-center absolute md:static bg-white w-full md:w-auto left-0 md:flex-row flex-col transition-all duration-300 ease-in-out ${
              menuOpen ? "top-16" : "top-[-400px]"
            }`}
          >
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <li
                  key={item.href}
                  className={`group relative px-3 py-2 transition-colors duration-300 ${
                    isActive
                      ? "text-orange-500 font-bold"
                      : "text-gray-700 hover:text-orange-500"
                  }`}
                >
                  <Link href={item.href}>{item.name}</Link>
                  {isActive && (
                    <motion.div
                      layoutId="underline"
                      className="absolute left-0 bottom-0 w-full h-1 bg-orange-500 rounded-full"
                    />
                  )}
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
                onClick={() => logout()}
                className="text-gray-500 px-4 py-2 rounded-lg hover:text-orange-500"
              >
                Sign Out
              </button>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
      </div>
    </header>
  );
};

export default Navbar;
