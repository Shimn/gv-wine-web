'use client';

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { getSupabaseBrowser } from '@/lib/supabase-browser';
import type { User as SupaUser, Session } from '@supabase/supabase-js';

// ── Perfil do usuário armazenado na tabela `perfis` ──
export interface Perfil {
  id: string;            // = auth.users.id (UUID)
  email: string;
  nome: string;
  role: 'dono' | 'admin' | 'vendedor' | 'viewer';
  ativo: boolean;
  created_at?: string;
}

interface AuthCtx {
  user: SupaUser | null;
  perfil: Perfil | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  refreshPerfil: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null, perfil: null, session: null, loading: true,
  signIn: async () => null, signOut: async () => {}, refreshPerfil: async () => {},
});

export function useAuth() { return useContext(Ctx); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser]       = useState<SupaUser | null>(null);
  const [perfil, setPerfil]   = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca perfil na tabela `perfis`
  const fetchPerfil = useCallback(async (uid: string) => {
    const { data } = await getSupabaseBrowser()
      .from('perfis')
      .select('*')
      .eq('id', uid)
      .single();
    setPerfil(data as Perfil | null);
  }, []);

  const refreshPerfil = useCallback(async () => {
    if (user) await fetchPerfil(user.id);
  }, [user, fetchPerfil]);

  useEffect(() => {
    // Session atual
    getSupabaseBrowser().auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchPerfil(s.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });

    // Listener de mudança de auth
    const { data: { subscription } } = getSupabaseBrowser().auth.onAuthStateChange(
      (_event, s) => {
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) fetchPerfil(s.user.id);
        else setPerfil(null);
      },
    );

    return () => subscription.unsubscribe();
  }, [fetchPerfil]);

  async function signIn(email: string, password: string): Promise<string | null> {
    const { error } = await getSupabaseBrowser().auth.signInWithPassword({ email, password });
    if (error) return error.message;
    return null;
  }

  async function signOut() {
    await getSupabaseBrowser().auth.signOut();
    setPerfil(null);
  }

  return (
    <Ctx.Provider value={{ user, perfil, session, loading, signIn, signOut, refreshPerfil }}>
      {children}
    </Ctx.Provider>
  );
}
