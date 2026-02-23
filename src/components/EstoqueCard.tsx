'use client';

import type { Vinho } from '@/lib/types';

interface EstoqueCardProps {
  vinho: Vinho;
}

const STATUS_COLORS = {
  ok:   'bg-green-100 text-green-700',
  low:  'bg-yellow-100 text-yellow-700',
  zero: 'bg-red-100 text-red-700',
};

export default function EstoqueCard({ vinho }: EstoqueCardProps) {
  const qtd = vinho.estoque?.[0]?.quantidade ?? 0;
  const statusKey = qtd === 0 ? 'zero' : qtd < 5 ? 'low' : 'ok';
  const statusLabel = qtd === 0 ? 'Sem estoque' : qtd < 5 ? 'Estoque baixo' : 'Em estoque';
  const statusColor = STATUS_COLORS[statusKey];

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            <span className="text-gray-400 text-xs font-normal mr-1">#{vinho.id}</span>
            {vinho.nome}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {(vinho.produtores as any)?.nome ?? '—'}
            {vinho.safra ? ` · Safra ${vinho.safra}` : ''}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3 text-xs text-gray-500">
          <span>📁 {(vinho.categorias as any)?.nome ?? '—'}</span>
          <span>🍾 {vinho.volume_ml ?? 750}ml</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Estoque</p>
          <p className="font-bold text-gray-800">{qtd} un.</p>
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">Venda</span>
        <span className="font-semibold text-wine-700 text-sm">
          R$ {vinho.preco_venda.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
