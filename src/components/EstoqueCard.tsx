'use client';

import type { Vinho } from '@/lib/types';

interface EstoqueCardProps {
  vinho: Vinho;
  onClick?: () => void;
}

const STATUS_COLORS = {
  ok:   'bg-green-100 text-green-700',
  low:  'bg-yellow-100 text-yellow-700',
  zero: 'bg-red-100 text-red-700',
};

export default function EstoqueCard({ vinho, onClick }: EstoqueCardProps) {
  const qtd = vinho.estoque?.[0]?.quantidade ?? 0;
  const statusKey = qtd === 0 ? 'zero' : qtd <= 2 ? 'low' : 'ok';
  const statusLabel = qtd === 0 ? 'Sem estoque' : qtd <= 2 ? 'Estoque baixo' : 'Em estoque';
  const statusColor = STATUS_COLORS[statusKey];

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-gray-100 rounded-xl p-4 shadow-sm transition-all ${
        onClick
          ? 'cursor-pointer hover:shadow-md hover:border-wine-200 hover:-translate-y-0.5 active:scale-[0.98]'
          : ''
      }`}
    >
      {/* Cabeçalho: nome + badge status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">
            <span className="text-gray-400 text-xs font-normal mr-1">#{vinho.id}</span>
            {vinho.nome}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {vinho.produtores?.nome ?? '--'}
            {vinho.safra ? ` · Safra ${vinho.safra}` : ''}
          </p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColor}`}>
          {statusLabel}
        </span>
      </div>

      {/* Categoria + volume + estoque */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex gap-3 text-xs text-gray-500">
          <span>{vinho.categorias?.nome ?? '--'}</span>
          <span>{vinho.volume_ml ?? 750} ml</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Estoque</p>
          <p className="font-bold text-gray-800">{qtd} un.</p>
        </div>
      </div>

      {/* Preço de venda + valor total */}
      <div className="mt-2 pt-2 border-t border-gray-50 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-400">Preço venda</span>
          <p className="font-semibold text-wine-700 text-sm">R$ {vinho.preco_venda.toFixed(2)}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-gray-400">Valor total</span>
          <p className="font-semibold text-green-700 text-sm">R$ {(qtd * vinho.preco_venda).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Hint de ação — só aparece quando o card é clicável */}
      {onClick && (
        <div className="mt-2 flex gap-1.5 text-[10px] text-gray-400">
          <span className="bg-blue-50 text-blue-500 rounded-full px-2 py-0.5">+ Estoque</span>
          <span className="bg-wine-50 text-wine-500 rounded-full px-2 py-0.5">Venda</span>
          <span className="bg-gray-100 rounded-full px-2 py-0.5">Editar</span>
        </div>
      )}
    </div>
  );
}
