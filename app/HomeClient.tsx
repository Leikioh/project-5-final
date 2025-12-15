"use client";

import { useSearchParams } from "next/navigation";

export default function HomeClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q");

  return (
    <main>
      {/* ton contenu */}
      {q && <p>Query: {q}</p>}
    </main>
  );
}
