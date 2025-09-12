"use client";

import { useEffect, useState } from "react";
import { apiPath } from "@/lib/api";

export type CurrentUser = { id: number; email: string; name: string | null };

type MeResponse =
  | { authenticated: true; user: CurrentUser }
  | { authenticated: false };

export function useCurrentUser(): { user: CurrentUser | null; loading: boolean } {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await fetch(apiPath("/api/auth/me"), {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (alive) setUser(null);
          return;
        }

        const data: unknown = await res.json().catch(() => null);
        const ok =
          data &&
          typeof data === "object" &&
          "authenticated" in data;

        if (!ok) {
          if (alive) setUser(null);
          return;
        }

        const me = data as MeResponse;
        if (me.authenticated) {
          if (alive) setUser(me.user);
        } else {
          if (alive) setUser(null);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  return { user, loading };
}
