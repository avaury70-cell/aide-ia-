import * as SecureStore from "expo-secure-store";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import { api, setAuthToken, setUnauthorizedHandler } from "../api/client";
import type { User } from "../api/types";

const TOKEN_KEY = "aide.token";

// SecureStore (Keychain / Keystore) peut être indisponible (web, appareil sans verrouillage) :
// la session reste alors en mémoire au lieu de bloquer l'application.
const tokenStore = {
  get: async () => {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: async (value: string | null) => {
    try {
      if (value) await SecureStore.setItemAsync(TOKEN_KEY, value);
      else await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // stockage sécurisé indisponible
    }
  },
};

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback(async (newToken: string | null, newUser: User | null) => {
    setAuthToken(newToken);
    setToken(newToken);
    setUser(newUser);
    await tokenStore.set(newToken);
  }, []);

  const logout = useCallback(() => applySession(null, null), [applySession]);

  useEffect(() => {
    setUnauthorizedHandler(() => void logout());
    (async () => {
      const stored = await tokenStore.get();
      if (stored) {
        setAuthToken(stored);
        try {
          const me = await api.me();
          setToken(stored);
          setUser(me);
        } catch {
          await applySession(null, null);
        }
      }
      setLoading(false);
    })();
    return () => setUnauthorizedHandler(null);
  }, [applySession, logout]);

  const value = useMemo<AuthState>(
    () => ({
      user,
      token,
      loading,
      logout,
      login: async (email, password) => {
        const res = await api.login(email, password);
        await applySession(res.access_token, res.user);
      },
      register: async (email, password, name) => {
        const res = await api.register(email, password, name);
        await applySession(res.access_token, res.user);
      },
    }),
    [user, token, loading, logout, applySession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé dans <AuthProvider>");
  return ctx;
}
