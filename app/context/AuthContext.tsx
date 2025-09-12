"use client";

import React, { createContext, JSX, useCallback, useContext, useEffect, useState } from "react";
import { apiPath } from "@/lib/api";

type AuthUser = { id: number; email: string; name: string | null };
type AuthState = { user: AuthUser | null; isAuthenticated: boolean };

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [state, setState] = useState<AuthState>({ user: null, isAuthenticated: false });

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch(apiPath("/api/auth/me"), { credentials: "include" });
      if (!res.ok) {
        setState({ user: null, isAuthenticated: false });
        return;
      }
      const data: { authenticated: boolean; user: AuthUser } = await res.json();
      if (data.authenticated) {
        setState({ user: data.user, isAuthenticated: true });
      } else {
        setState({ user: null, isAuthenticated: false });
      }
    } catch {
      setState({ user: null, isAuthenticated: false });
    }
  }, []);

  const login = useCallback(async (): Promise<void> => {
    await refresh();
  }, [refresh]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await fetch(apiPath("/api/auth/logout"), {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setState({ user: null, isAuthenticated: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value: AuthContextType = {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    refresh,
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
