"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api, onSessionExpired, tokens } from "./api";
import type { AuthResponse, Profile } from "./types";

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  dateOfBirth: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextValue {
  user: Profile | null;
  /** True until the stored session has been checked. */
  loading: boolean;
  login: (identifier: string, password: string) => Promise<Profile>;
  register: (input: RegisterInput) => Promise<Profile>;
  logout: () => Promise<void>;
  /** Clears local state only (e.g. after self-exclusion revoked every session). */
  forget: () => void;
  refreshUser: () => Promise<Profile | null>;
  setBalance: (balance: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function loadProfile(): Promise<Profile | null> {
  if (!tokens.refresh && !tokens.access) return null;
  try {
    return await api<Profile>("/account/me");
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const qc = useQueryClient();

  const refreshUser = useCallback(async () => {
    const me = await loadProfile();
    setUser(me);
    return me;
  }, []);

  useEffect(() => {
    let alive = true;
    loadProfile().then((me) => {
      if (!alive) return;
      setUser(me);
      setLoading(false);
    });
    const off = onSessionExpired(() => {
      setUser(null);
      qc.clear();
    });
    return () => {
      alive = false;
      off();
    };
  }, [qc]);

  const afterAuth = useCallback(
    async (res: AuthResponse) => {
      tokens.set(res);
      qc.clear();
      const me = await api<Profile>("/account/me");
      setUser(me);
      return me;
    },
    [qc],
  );

  const login = useCallback(
    async (identifier: string, password: string) =>
      afterAuth(await api<AuthResponse>("/auth/login", { method: "POST", body: { identifier, password }, auth: false })),
    [afterAuth],
  );

  const register = useCallback(
    async (input: RegisterInput) =>
      afterAuth(await api<AuthResponse>("/auth/register", { method: "POST", body: input, auth: false })),
    [afterAuth],
  );

  const forget = useCallback(() => {
    tokens.clear();
    setUser(null);
    qc.clear();
  }, [qc]);

  const logout = useCallback(async () => {
    const rt = tokens.refresh;
    if (rt) {
      try {
        await api("/auth/logout", { method: "POST", body: { refreshToken: rt }, auth: false });
      } catch {
        /* ignore – we clear locally either way */
      }
    }
    forget();
  }, [forget]);

  const setBalance = useCallback((balance: string) => {
    setUser((u) => (u ? { ...u, wallet: { currency: u.wallet?.currency ?? "NGN", balance } } : u));
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, forget, refreshUser, setBalance }),
    [user, loading, login, register, logout, forget, refreshUser, setBalance],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
