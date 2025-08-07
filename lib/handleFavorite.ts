import { getSession } from "next-auth/react";

export async function handleFavorite(slug: string) {
  const session = await getSession();

  if (!session) {
    alert("You need to be logged in to favorite recipes.");
    return;
  }

  try {
    await fetch("/api/favorites", {
      method: "POST",
      body: JSON.stringify({ slug }),
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (err) {
    console.error("Failed to save favorite", err);
  }
}