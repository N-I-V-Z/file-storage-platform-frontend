"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { apiClient } from "@/src/lib/http/api-client";
import type { Credentials, User } from "../types/auth.types";

type AuthState = {
  user: User | null;
  pending: boolean;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [pending, setPending] = useState(true);

  useEffect(() => {
    let active = true;
    const unsubscribe = apiClient.onSessionLost(() => {
      if (active) setUser(null);
    });
    void (async () => {
      const refreshed = await apiClient.refresh();
      if (refreshed) {
        try {
          const account = await apiClient.me();
          if (active) setUser(account);
        } catch {
          apiClient.clearSession();
        }
      }
      if (active) setPending(false);
    })();
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  async function login(credentials: Credentials) {
    const account = await apiClient.login(credentials);
    setUser(account);
  }

  async function logout() {
    await apiClient.logout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, pending, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
