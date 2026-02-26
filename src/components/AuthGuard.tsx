'use client';

import { useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

const PUBLIC_PATHS = ['/login', '/cadastro'];

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, perfil, loading, signOut } = useAuth();
  const pathname = usePathname();
  const router   = useRouter();

  const isPublic = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (loading) return;

    if (!user && !isPublic) {
      router.replace('/login');
    }
    if (user && isPublic) {
      // Se o usuário está inativo, não redireciona para home
      if (perfil && !perfil.ativo) return;
      router.replace('/');
    }
  }, [user, perfil, loading, isPublic, router]);

  // Tela de loading
  if (loading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-wine-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-400 mt-3">Carregando…</p>
        </div>
      </div>
    );
  }

  // Não autenticado em rota protegida
  if (!user && !isPublic) return null;

  // Autenticado mas inativo — mostra tela de "aguardando aprovação"
  if (user && perfil && !perfil.ativo && !isPublic) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-wine-950 via-wine-900 to-wine-800 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl space-y-4">
            <div className="text-5xl">⏳</div>
            <h2 className="text-lg font-bold text-gray-900">Aguardando aprovação</h2>
            <p className="text-sm text-gray-500">
              Olá, <span className="font-medium text-gray-700">{perfil.nome}</span>!
              Sua conta está pendente de aprovação por um administrador.
            </p>
            <p className="text-xs text-gray-400">
              Você receberá acesso assim que sua conta for ativada.
            </p>
            <button
              onClick={signOut}
              className="bg-wine-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-wine-800 transition-colors"
            >
              🚪 Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Autenticado em rota pública (e ativo) — redirect em andamento
  if (user && isPublic && perfil?.ativo) return null;

  return <>{children}</>;
}
