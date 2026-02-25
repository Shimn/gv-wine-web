'use client';

import type { Cafe } from '@/lib/types';

interface CafeCardProps {
  cafe: Cafe;
  onClick?: () => void;
}

const STATUS_COLORS = {
  ok:   'bg-green-100 text-green-700',
  low:  'bg-yellow-100 text-yellow-700',
  zero: 'bg-red-100 text-red-700',
};

export default function CafeCard({ cafe, onClick }: CafeCardProps) {
  const qtd = cafe.estoque_cafe?.[0]?.quantidade ?? 0;
  const statusKey = qtd === 0 ? 'zero' : qtd < 5 ? 'low' : 'ok';
  const statusLabel = qtd === 0 ? 'Sem estoque' : qtd < 5 ? 'Estoque baixo' : 'Em estoque';
  const statusColor = STATUS_COLORS[statusKey];

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm transition-all ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:border-amber-200 hover:-translate-y-0.5 active:scale-[0.98]'
          : ''
      }`}
    >
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            <span className="text-gray-400 text-xs font-normal mr-1">#{cafe.id}</span>
            {cafe.nome}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {cafe.origem ?? '--'}
            {cafe.torra ? ` · Torra ${cafe.torra}` : ''}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Info + estoque */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{cafe.tipo_grao ?? '--'}</span>
          <span>{cafe.peso_g ?? 250}g</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Estoque</p>
          <p className="font-bold text-gray-800">{qtd} un.</p>
        </div>
      </div>

      {/* Preço de venda */}
      <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">Preço venda</span>
        <span className="font-semibold text-amber-700 text-sm">
          R$ {cafe.preco_venda.toFixed(2)}
        </span>
      </div>

      {/* Hint de ação */}
      {onClick && (
        <div className="mt-2 flex gap-1.5 text-[10px] text-gray-400">
          <span className="bg-blue-50 text-blue-500 rounded-full px-2 py-0.5">+ Estoque</span>
          <span className="bg-amber-50 text-amber-500 rounded-full px-2 py-0.5">Venda</span>
          <span className="bg-gray-100 rounded-full px-2 py-0.5">Editar</span>
        </div>
      )}
    </div>
  );
}
