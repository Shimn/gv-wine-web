'use client';

import { useEffect, useState } from 'react';
import EstoqueCard from '@/components/EstoqueCard';
import type { Vinho } from '@/lib/types';

export default function EstoquePage() {
  const [vinhos, setVinhos]   = useState<Vinho[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [category, setCategory] = useState('Todas');
  const [error, setError]     = useState('');

  useEffect(() => {
    fetch('/api/estoque')
      .then((r) => r.json())
      .then((d) => setVinhos(d.vinhos ?? []))
      .catch(() => setError('Erro ao carregar estoque.'))
      .finally(() => setLoading(false));
  }, []);

  const categorias = ['Todas', ...Array.from(new Set(vinhos.map((v) => (v.categorias as any)?.nome).filter(Boolean)))];

  const filtered = vinhos.filter((v) => {
    const matchSearch = v.nome.toLowerCase().includes(search.toLowerCase()) ||
      (v.produtores as any)?.nome?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Todas' || (v.categorias as any)?.nome === category;
    return matchSearch && matchCat;
  });

  const totalUnidades = filtered.reduce((s, v) => s + (v.estoque?.[0]?.quantidade ?? 0), 0);
  const semEstoque    = filtered.filter((v) => (v.estoque?.[0]?.quantidade ?? 0) === 0).length;
  const baixoEstoque  = filtered.filter((v) => { const q = v.estoque?.[0]?.quantidade ?? 0; return q > 0 && q < 5; }).length;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">📦 Estoque de Vinhos</h1>

        {/* Stats */}
        <div className="flex gap-4 mt-3 text-xs">
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Tipos</p>
            <p className="font-bold text-gray-800">{filtered.length}</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Unidades</p>
            <p className="font-bold text-gray-800">{totalUnidades}</p>
          </div>
          {semEstoque > 0 && (
            <div className="bg-red-50 rounded-lg px-3 py-2">
              <p className="text-red-400">Zerados</p>
              <p className="font-bold text-red-600">{semEstoque}</p>
            </div>
          )}
          {baixoEstoque > 0 && (
            <div className="bg-yellow-50 rounded-lg px-3 py-2">
              <p className="text-yellow-500">Baixo</p>
              <p className="font-bold text-yellow-600">{baixoEstoque}</p>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Buscar vinho ou produtor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-wine-400"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-wine-400"
          >
            {categorias.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-wine-700 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {error && <p className="text-center text-red-500 py-8">{error}</p>}
        {!loading && filtered.length === 0 && (
          <p className="text-center text-gray-400 py-8">Nenhum vinho encontrado.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((v) => <EstoqueCard key={v.id} vinho={v} />)}
        </div>
      </div>
    </div>
  );
}
