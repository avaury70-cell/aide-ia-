import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { User } from "../api/types";
import { bridge } from "../lib/bridge";

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bridge
      .session()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const authenticate = useCallback(async (p: ReturnType<typeof bridge.login>) => {
    const res = await p;
    if (!res.ok || !res.data) throw new Error(res.error ?? "Connexion impossible");
    setUser(res.data);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      login: (email, password) => authenticate(bridge.login(email, password)),
      register: (email, password, name) => authenticate(bridge.register(email, password, name)),
      logout: async () => {
        await bridge.logout();
        setUser(null);
      },
    }),
    [user, loading, authenticate],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth hors de <AuthProvider>");
  return ctx;
}
