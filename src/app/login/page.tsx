'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError('');

    const err = await signIn(email, password);
    if (err) {
      setError(err === 'Invalid login credentials'
        ? 'E-mail ou senha incorretos.'
        : err);
    }
    setLoading(false);
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-wine-950 via-wine-900 to-wine-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🍷</span>
          <h1 className="text-2xl font-bold text-white mt-3">GV Wine</h1>
          <p className="text-wine-300 text-sm mt-1">Gestão de Estoque</p>
        </div>

        {/* Card */}
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-wine-500 focus:ring-1 focus:ring-wine-500"
              placeholder="seu@email.com"
              autoComplete="email"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-wine-500 focus:ring-1 focus:ring-wine-500"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full bg-wine-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-wine-800 transition-colors disabled:opacity-50"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-wine-400 text-xs mt-6">
          Acesso restrito a usuários autorizados
        </p>
      </div>
    </div>
  );
}
