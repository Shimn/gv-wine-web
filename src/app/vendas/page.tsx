'use client';

import { useEffect, useState } from 'react';
import type { Venda } from '@/lib/types';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  concluida: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
  pendente:  { label: 'Pendente',  color: 'bg-yellow-100 text-yellow-700' },
  cancelada: { label: 'Cancelada', color: 'bg-red-100 text-red-700' },
};

const PAGAMENTO_ICONS: Record<string, string> = {
  dinheiro: '💵', pix: '📱', credito: '💳', debito: '💳', boleto: '📄',
};

export default function VendasPage() {
  const [vendas, setVendas]   = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/vendas')
      .then((r) => r.json())
      .then((d) => setVendas(d.vendas ?? []))
      .catch(() => setError('Erro ao carregar vendas.'))
      .finally(() => setLoading(false));
  }, []);

  const totalFaturamento = vendas.filter((v) => v.status === 'concluida').reduce((s, v) => s + (v.valor_final ?? 0), 0);
  const totalConcluidas  = vendas.filter((v) => v.status === 'concluida').length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">💰 Vendas</h1>

        <div className="flex gap-4 mt-3 text-xs">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Total de vendas</p>
            <p className="font-bold text-gray-800">{vendas.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Concluídas</p>
            <p className="font-bold text-green-700">{totalConcluidas}</p>
          </div>
          <div className="bg-wine-50 rounded-lg px-3 py-2">
            <p className="text-wine-500">Faturamento</p>
            <p className="font-bold text-wine-700">R$ {totalFaturamento.toFixed(2)}</p>
          </div>
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
        {!loading && vendas.length === 0 && (
          <p className="text-center text-gray-400 py-8">Nenhuma venda registrada.</p>
        )}

        <div className="space-y-3">
          {vendas.map((venda) => {
            const status  = STATUS_LABELS[venda.status] ?? STATUS_LABELS.pendente;
            const pgIcon  = PAGAMENTO_ICONS[venda.forma_pagamento ?? ''] ?? '💳';
            const dataFmt = new Date(venda.data_venda).toLocaleDateString('pt-BR', {
              day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
            });

            return (
              <div key={venda.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-400">#{venda.id}</span>
                      {venda.clientes && (
                        <span className="text-xs text-gray-600">{(venda.clientes as any).nome}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{dataFmt}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${status.color}`}>
                    {status.label}
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{pgIcon}</span>
                    <span className="capitalize">{venda.forma_pagamento ?? 'N/A'}</span>
                    {venda.desconto > 0 && (
                      <span className="text-red-400">- R$ {venda.desconto.toFixed(2)}</span>
                    )}
                  </div>
                  <div className="text-right">
                    {venda.desconto > 0 && (
                      <p className="text-xs text-gray-400 line-through">R$ {venda.valor_total.toFixed(2)}</p>
                    )}
                    <p className="font-bold text-wine-700">R$ {venda.valor_final.toFixed(2)}</p>
                  </div>
                </div>

                {venda.observacoes && (
                  <p className="mt-2 text-xs text-gray-400 border-t border-gray-50 pt-2">{venda.observacoes}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
