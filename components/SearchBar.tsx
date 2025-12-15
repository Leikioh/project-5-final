"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function SearchBar(): React.JSX.Element {
  const router = useRouter();
  const params = useSearchParams();
  const [value, setValue] = React.useState<string>(params.get("q") ?? "");

  // Reste synchronisé si l'URL change ailleurs (back/forward)
  React.useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  // Debounce 300 ms → met à jour l’URL ?q=...&page=1
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const q = value.trim();
      const sp = new URLSearchParams(Array.from(params.entries()));
      if (q) sp.set("q", q);
      else sp.delete("q");
      sp.set("page", "1");
      router.replace(`?${sp.toString()}`);
    }, 300);
    return () => window.clearTimeout(id);
  }, [value, params, router]);

  return (
    <div className="w-full flex items-center bg-white shadow-md rounded-lg p-4 mt-10 max-w-7xl mx-auto">
      <label htmlFor="home-q" className="sr-only">Search for recipes</label>
      <input
        id="home-q"
        type="search"
        className="w-full px-4 py-2 outline-none border-none text-black"
        placeholder="Search for recipes..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </div>
  );
}
