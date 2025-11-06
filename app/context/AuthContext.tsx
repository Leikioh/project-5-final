"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

/* ── Types ─────────────────────────────────────────────── */
export type AuthRole = "USER" | "ADMIN";

export type AuthUser = {
  id: number;
  email: string;
  name: string | null;
  role: AuthRole;
};

export type AuthContextType = {
  me: AuthUser | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

/* ── Type guards ───────────────────────────────────────── */
function isAuthRole(v: unknown): v is AuthRole {
  return v === "USER" || v === "ADMIN";
}

function isAuthUser(v: unknown): v is AuthUser {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  const hasId = typeof o.id === "number";
  const hasEmail = typeof o.email === "string";
  const hasName = o.name === null || typeof o.name === "string";
  const role = o.role;
  return hasId && hasEmail && hasName && isAuthRole(role);
}

type MeResponse = { user: AuthUser | null } | { user: Omit<AuthUser, "role"> | null };

/* ── Context ───────────────────────────────────────────── */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
      });

      // On tolère des variantes de payload, tout en restant typé
      const data = (await res.json()) as MeResponse;

      const rawUser = "user" in data ? data.user : null;

      if (rawUser && isAuthUser(rawUser)) {
        setMe(rawUser);
      } else if (rawUser && !("role" in rawUser)) {
        // Fallback si l’API ne renvoie pas encore le rôle
        setMe({ ...rawUser, role: "USER" });
      } else {
        setMe(null);
      }
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMe();
  }, [loadMe]);

  const login = useCallback(async () => {
    await loadMe();
  }, [loadMe]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setMe(null);
    }
  }, []);

  const value: AuthContextType = {
    me,
    loading,
    isAdmin: me?.role === "ADMIN",
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
