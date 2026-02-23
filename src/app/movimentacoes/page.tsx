'use client';

import { useEffect, useState } from 'react';
import type { MovimentacaoEstoque } from '@/lib/types';

const TIPO_CONFIG: Record<string, { icon: string; label: string; color: string }> = {
  entrada: { icon: '📥', label: 'Entrada',  color: 'text-green-600 bg-green-50' },
  saida:   { icon: '📤', label: 'Saída',    color: 'text-red-600 bg-red-50' },
  ajuste:  { icon: '🔧', label: 'Ajuste',   color: 'text-blue-600 bg-blue-50' },
  perda:   { icon: '❌', label: 'Perda',    color: 'text-gray-600 bg-gray-50' },
};

export default function MovimentacoesPage() {
  const [movs, setMovs]       = useState<MovimentacaoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [filter, setFilter]   = useState('todos');

  useEffect(() => {
    fetch('/api/movimentacoes')
      .then((r) => r.json())
      .then((d) => setMovs(d.movimentacoes ?? []))
      .catch(() => setError('Erro ao carregar histórico.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'todos' ? movs : movs.filter((m) => m.tipo === filter);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">📋 Histórico de Movimentações</h1>

        {/* Filter buttons */}
        <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
          {['todos', 'entrada', 'saida', 'ajuste', 'perda'].map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors
                ${filter === t
                  ? 'bg-wine-700 text-white border-wine-700'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-wine-300'
                }`}
            >
              {t === 'todos' ? 'Todos' : TIPO_CONFIG[t]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-wine-700 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && <p className="text-center text-red-500 py-8">{error}</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">Nenhuma movimentação encontrada.</p>
        )}

        <div className="space-y-2">
          {filtered.map((mov) => {
            const cfg   = TIPO_CONFIG[mov.tipo] ?? TIPO_CONFIG.ajuste;
            const vinho = (mov.vinhos as any);
            const data  = new Date(mov.created_at).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric',
              hour: '2-digit', minute: '2-digit',
            });

            return (
              <div key={mov.id} className="bg-white border border-gray-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm shrink-0 ${cfg.color}`}>
                  {cfg.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {vinho?.nome ?? `Vinho #${mov.vinho_id}`}
                  </p>
                  <p className="text-xs text-gray-400">{mov.motivo ?? '—'} · {data}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className={`text-sm font-bold ${mov.tipo === 'saida' || mov.tipo === 'perda' ? 'text-red-600' : 'text-green-600'}`}>
                    {mov.tipo === 'saida' || mov.tipo === 'perda' ? '-' : '+'}{mov.quantidade}
                  </p>
                  <p className="text-xs text-gray-400">unidades</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
