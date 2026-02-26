'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CadastroPage() {
  const [nome, setNome]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !email || !password) return;
    setLoading(true);
    setError('');

    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, email, password }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error);
        return;
      }
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-wine-950 via-wine-900 to-wine-800 px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🍷</span>
          <h1 className="text-2xl font-bold text-white mt-3">GV Wine</h1>
          <p className="text-wine-300 text-sm mt-1">Criar conta</p>
        </div>

        {success ? (
          /* Tela de sucesso */
          <div className="bg-white rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="text-4xl">⏳</div>
            <h2 className="text-lg font-bold text-gray-900">Cadastro enviado!</h2>
            <p className="text-sm text-gray-500">
              Sua conta foi criada e está aguardando aprovação de um administrador.
              Você receberá acesso assim que for aprovado.
            </p>
            <Link
              href="/login"
              className="inline-block bg-wine-700 text-white rounded-xl px-5 py-2.5 text-sm font-medium hover:bg-wine-800 transition-colors"
            >
              Voltar ao login
            </Link>
          </div>
        ) : (
          /* Formulário */
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-2xl space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome completo</label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-wine-500 focus:ring-1 focus:ring-wine-500"
                placeholder="Seu nome"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-wine-500 focus:ring-1 focus:ring-wine-500"
                placeholder="seu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-wine-500 focus:ring-1 focus:ring-wine-500"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !nome || !email || !password}
              className="w-full bg-wine-700 text-white rounded-xl py-3 text-sm font-semibold hover:bg-wine-800 transition-colors disabled:opacity-50"
            >
              {loading ? 'Cadastrando…' : 'Criar conta'}
            </button>

            <p className="text-center text-xs text-gray-400">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-wine-600 hover:text-wine-700 font-medium">
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
