"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "../hooks/useCurrentUser";

export const dynamic = "force-dynamic"; // évite la pré-génération statique

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading } = useCurrentUser();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/sign-in");
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return <div className="py-10 text-center">Chargement…</div>;
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Mon profil</h1>
      <div className="bg-white shadow rounded p-6">
        <p><span className="font-semibold">Nom :</span> {user.name ?? "—"}</p>
        <p className="mt-2"><span className="font-semibold">Email :</span> {user.email}</p>
      </div>
    </main>
  );
}
