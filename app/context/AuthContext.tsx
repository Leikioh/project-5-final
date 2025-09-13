"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type AuthUser = { id: number; email: string; name: string | null };

export type AuthContextType = {
  me: AuthUser | null;
  loading: boolean;
  login: () => Promise<void>;   // recharge /me après un login réussi
  logout: () => Promise<void>;  // appelle /api/auth/logout puis remet me=null
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [me, setMe] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      const data = (await res.json()) as { user: AuthUser | null };
      setMe(data.user ?? null);
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
    // à appeler juste après un POST /api/auth/login OK
    await loadMe();
  }, [loadMe]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      setMe(null);
    }
  }, []);

  const value: AuthContextType = { me, loading, login, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
