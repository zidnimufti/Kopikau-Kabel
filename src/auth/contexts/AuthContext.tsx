// src/auth/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "../../api/supabaseClient";

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // <- default TRUE, supaya tidak ada flicker

  // Boot: pulihkan sesi + subscribe perubahan
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!mounted) return;
        setUser(data.session?.user ?? null);
      } finally {
        if (mounted) setLoading(false); // hanya dimatikan setelah getSession selesai
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setLoading(false);
      throw error;
    }
    setUser(data.user ?? null);
    setLoading(false);
  };

  const logout = async () => {
    setLoading(true);
    // Logout lokal sudah cukup untuk SPA; global dapat memicu 403 bila tidak pakai cookie auth server.
    await supabase.auth.signOut().catch(() => {});
    setUser(null);
    setLoading(false);
  };

  const value = useMemo(
    () => ({ user, loading, signInWithPassword, logout }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used within AuthProvider");
  return ctx;
}
