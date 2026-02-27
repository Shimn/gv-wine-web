'use client';

import { useCallback, useEffect, useState } from 'react';
import EstoqueCard from '@/components/EstoqueCard';
import CafeCard from '@/components/CafeCard';
import WinePanel from '@/components/WinePanel';
import CoffeePanel from '@/components/CoffeePanel';
import type { Vinho, Cafe } from '@/lib/types';

interface SelectOption { id: number; nome: string }

type PanelMode = 'view' | 'new';
type ProductTab = 'vinhos' | 'cafes';

export default function EstoquePage() {
  // ── Tab de produto ──
  const [productTab, setProductTab] = useState<ProductTab>('vinhos');

  // ── Vinhos ──
  const [vinhos,    setVinhos]    = useState<Vinho[]>([]);
  const [loadingV,  setLoadingV]  = useState(true);

  // ── Cafés ──
  const [cafes,    setCafes]    = useState<Cafe[]>([]);
  const [loadingC, setLoadingC] = useState(true);

  // ── Compartilhados ──
  const [search,       setSearch]       = useState('');
  const [category,     setCategory]     = useState('Todas');
  const [stockFilter,  setStockFilter]  = useState<'todos' | 'zerado' | 'baixo'>('todos');
  const [error,        setError]        = useState('');

  const [categorias,  setCategorias]  = useState<SelectOption[]>([]);
  const [produtores,  setProdutores]  = useState<SelectOption[]>([]);

  // ── Painel lateral VINHO ──
  const [winePanelVinho, setWinePanelVinho] = useState<Vinho | null>(null);
  const [winePanelMode,  setWinePanelMode]  = useState<PanelMode>('view');
  const [winePanelOpen,  setWinePanelOpen]  = useState(false);

  // ── Painel lateral CAFÉ ──
  const [coffeePanelCafe, setCoffeePanelCafe] = useState<Cafe | null>(null);
  const [coffeePanelMode, setCoffeePanelMode] = useState<PanelMode>('view');
  const [coffeePanelOpen, setCoffeePanelOpen] = useState(false);

  // ── Fetch vinhos ──
  const fetchVinhos = useCallback(() => {
    setLoadingV(true);
    fetch('/api/estoque')
      .then((r) => r.json())
      .then((d) => setVinhos(d.vinhos ?? []))
      .catch(() => setError('Erro ao carregar estoque de vinhos.'))
      .finally(() => setLoadingV(false));
  }, []);

  // ── Fetch cafés ──
  const fetchCafes = useCallback(() => {
    setLoadingC(true);
    fetch('/api/estoque-cafe')
      .then((r) => r.json())
      .then((d) => setCafes(d.cafes ?? []))
      .catch(() => setError('Erro ao carregar estoque de cafés.'))
      .finally(() => setLoadingC(false));
  }, []);

  useEffect(() => {
    fetchVinhos();
    fetchCafes();
    fetch('/api/categorias').then((r) => r.json()).then((d) => setCategorias(d.categorias ?? []));
    fetch('/api/produtores').then((r) => r.json()).then((d) => setProdutores(d.produtores ?? []));
  }, [fetchVinhos, fetchCafes]);

  // Resetar filtros ao trocar de aba
  useEffect(() => {
    setSearch('');
    setCategory('Todas');
    setStockFilter('todos');
  }, [productTab]);

  // ── Abrir painéis VINHO ──
  function openVinho(v: Vinho) {
    setWinePanelVinho(v);
    setWinePanelMode('view');
    setWinePanelOpen(true);
  }
  function openNovoVinho() {
    setWinePanelVinho(null);
    setWinePanelMode('new');
    setWinePanelOpen(true);
  }

  // ── Abrir painéis CAFÉ ──
  function openCafe(c: Cafe) {
    setCoffeePanelCafe(c);
    setCoffeePanelMode('view');
    setCoffeePanelOpen(true);
  }
  function openNovoCafe() {
    setCoffeePanelCafe(null);
    setCoffeePanelMode('new');
    setCoffeePanelOpen(true);
  }

  // ── Helpers de filtragem ──
  function getQtdVinho(v: Vinho) { return v.estoque?.[0]?.quantidade ?? 0; }
  function getQtdCafe(c: Cafe) { return c.estoque_cafe?.[0]?.quantidade ?? 0; }

  // ───────── VINHOS: filtros ─────────
  const categoriasLista = ['Todas', ...Array.from(new Set(
    vinhos.map((v) => v.categorias?.nome).filter(Boolean)
  ))];

  const baseFilteredV = vinhos.filter((v) => {
    const matchSearch =
      v.nome.toLowerCase().includes(search.toLowerCase()) ||
      v.produtores?.nome?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Todas' || v.categorias?.nome === category;
    return matchSearch && matchCat;
  });

  const semEstoqueV   = baseFilteredV.filter((v) => getQtdVinho(v) === 0).length;
  const baixoEstoqueV = baseFilteredV.filter((v) => { const q = getQtdVinho(v); return q > 0 && q <= 2; }).length;

  const filteredV = baseFilteredV.filter((v) => {
    if (stockFilter === 'todos') return true;
    const qtd = getQtdVinho(v);
    if (stockFilter === 'zerado') return qtd === 0;
    if (stockFilter === 'baixo') return qtd > 0 && qtd <= 2;
    return true;
  });

  const totalUnidadesV = filteredV.reduce((s, v) => s + getQtdVinho(v), 0);
  const valorTotalV = baseFilteredV.reduce((s, v) => s + getQtdVinho(v) * (v.preco_venda ?? 0), 0);

  // ───────── CAFÉS: filtros ─────────
  const torrasLista = ['Todas', ...Array.from(new Set(
    cafes.map((c) => c.torra).filter(Boolean)
  ))] as string[];

  const baseFilteredC = cafes.filter((c) => {
    const matchSearch =
      c.nome.toLowerCase().includes(search.toLowerCase()) ||
      c.origem?.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === 'Todas' || c.torra === category;
    return matchSearch && matchCat;
  });

  const semEstoqueC   = baseFilteredC.filter((c) => getQtdCafe(c) === 0).length;
  const baixoEstoqueC = baseFilteredC.filter((c) => { const q = getQtdCafe(c); return q > 0 && q < 5; }).length;

  const filteredC = baseFilteredC.filter((c) => {
    if (stockFilter === 'todos') return true;
    const qtd = getQtdCafe(c);
    if (stockFilter === 'zerado') return qtd === 0;
    if (stockFilter === 'baixo') return qtd > 0 && qtd < 5;
    return true;
  });

  const totalUnidadesC = filteredC.reduce((s, c) => s + getQtdCafe(c), 0);
  const valorTotalC = baseFilteredC.reduce((s, c) => s + getQtdCafe(c) * (c.preco_venda ?? 0), 0);

  // ── Variáveis dinâmicas por aba ──
  const isVinho = productTab === 'vinhos';
  const loading = isVinho ? loadingV : loadingC;
  const baseCount = isVinho ? baseFilteredV.length : baseFilteredC.length;
  const totalUnidades = isVinho ? totalUnidadesV : totalUnidadesC;
  const semEstoque = isVinho ? semEstoqueV : semEstoqueC;
  const baixoEstoque = isVinho ? baixoEstoqueV : baixoEstoqueC;
  const valorTotal = isVinho ? valorTotalV : valorTotalC;
  const filterList = isVinho ? categoriasLista : torrasLista;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-bold text-gray-900">Estoque</h1>
          <button
            onClick={isVinho ? openNovoVinho : openNovoCafe}
            className={`flex items-center gap-1.5 text-white text-sm px-3 py-2 rounded-xl transition-colors shrink-0 ${
              isVinho ? 'bg-wine-700 hover:bg-wine-800' : 'bg-amber-700 hover:bg-amber-800'
            }`}
          >
            <span className="text-base leading-none">+</span>
            <span className="hidden sm:inline">{isVinho ? 'Novo vinho' : 'Novo café'}</span>
          </button>
        </div>

        {/* Toggle Vinhos / Cafés */}
        <div className="flex mt-3 bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setProductTab('vinhos')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
              isVinho
                ? 'bg-white text-wine-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>🍷</span> Vinhos
          </button>
          <button
            onClick={() => setProductTab('cafes')}
            className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 rounded-md transition-colors ${
              !isVinho
                ? 'bg-white text-amber-800 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <span>☕</span> Cafés
          </button>
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-3 text-xs flex-wrap">
          <div
            onClick={() => setStockFilter('todos')}
            className={`rounded-lg px-3 py-2 cursor-pointer transition-colors ${
              stockFilter === 'todos'
                ? (isVinho ? 'bg-wine-100 ring-1 ring-wine-400' : 'bg-amber-100 ring-1 ring-amber-400')
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <p className="text-gray-500">Tipos</p>
            <p className="font-bold text-gray-800">{baseCount}</p>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2">
            <p className="text-gray-500">Unidades</p>
            <p className="font-bold text-gray-800">{totalUnidades}</p>
          </div>
          <div className={`rounded-lg px-3 py-2 ${isVinho ? 'bg-green-50' : 'bg-green-50'}`}>
            <p className="text-gray-500">Valor total</p>
            <p className="font-bold text-green-700">R$ {valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          {semEstoque > 0 && (
            <div
              onClick={() => setStockFilter(stockFilter === 'zerado' ? 'todos' : 'zerado')}
              className={`rounded-lg px-3 py-2 cursor-pointer transition-colors ${stockFilter === 'zerado' ? 'bg-red-200 ring-1 ring-red-400' : 'bg-red-50 hover:bg-red-100'}`}
            >
              <p className="text-red-400">Zerados</p>
              <p className="font-bold text-red-600">{semEstoque}</p>
            </div>
          )}
          {baixoEstoque > 0 && (
            <div
              onClick={() => setStockFilter(stockFilter === 'baixo' ? 'todos' : 'baixo')}
              className={`rounded-lg px-3 py-2 cursor-pointer transition-colors ${stockFilter === 'baixo' ? 'bg-yellow-200 ring-1 ring-yellow-400' : 'bg-yellow-50 hover:bg-yellow-100'}`}
            >
              <p className="text-yellow-500">Baixo</p>
              <p className="font-bold text-yellow-600">{baixoEstoque}</p>
            </div>
          )}
        </div>

        {/* Filtros */}
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder={isVinho ? 'Buscar vinho ou produtor...' : 'Buscar café ou origem...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none ${
              isVinho ? 'focus:border-wine-400' : 'focus:border-amber-400'
            }`}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className={`text-sm border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none ${
              isVinho ? 'focus:border-wine-400' : 'focus:border-amber-400'
            }`}
          >
            {filterList.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {loading && (
          <div className="flex justify-center py-12">
            <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${
              isVinho ? 'border-wine-700' : 'border-amber-700'
            }`} />
          </div>
        )}
        {error && <p className="text-center text-red-500 py-8">{error}</p>}
        {!loading && (isVinho ? filteredV : filteredC).length === 0 && (
          <div className="flex flex-col items-center py-12 gap-3 text-gray-400">
            <p className="text-4xl">{isVinho ? '🍷' : '☕'}</p>
            <p>Nenhum {isVinho ? 'vinho' : 'café'} encontrado.</p>
            <button
              onClick={isVinho ? openNovoVinho : openNovoCafe}
              className={`text-sm hover:underline ${isVinho ? 'text-wine-600' : 'text-amber-600'}`}
            >
              Cadastrar novo {isVinho ? 'vinho' : 'café'}
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {isVinho
            ? filteredV.map((v) => (
                <EstoqueCard key={v.id} vinho={v} onClick={() => openVinho(v)} />
              ))
            : filteredC.map((c) => (
                <CafeCard key={c.id} cafe={c} onClick={() => openCafe(c)} />
              ))
          }
        </div>
      </div>

      {/* Painel deslizante VINHO */}
      {winePanelOpen && (
        <WinePanel
          vinho={winePanelVinho}
          mode={winePanelMode}
          onClose={() => { setWinePanelOpen(false); setWinePanelVinho(null); }}
          onSuccess={fetchVinhos}
          categorias={categorias}
          produtores={produtores}
        />
      )}

      {/* Painel deslizante CAFÉ */}
      {coffeePanelOpen && (
        <CoffeePanel
          cafe={coffeePanelCafe}
          mode={coffeePanelMode}
          onClose={() => { setCoffeePanelOpen(false); setCoffeePanelCafe(null); }}
          onSuccess={fetchCafes}
        />
      )}
    </div>
  );
}
