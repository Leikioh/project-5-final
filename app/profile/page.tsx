"use client";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/sign");
  }, [status]);

  if (status === "loading") return <p>Loading...</p>;

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Welcome, {session?.user?.name} 👋</h1>
      <p>Your email: {session?.user?.email}</p>
    </div>
  );
}
