'use client';

import { useEffect, useRef, useState } from 'react';
import type { Cafe } from '@/lib/types';

// ─── Tipos locais ────────────────────────────────────────────────────────────
type PanelTab = 'info' | 'entrada' | 'venda' | 'editar';
type PanelMode = 'view' | 'new';

interface CoffeePanelProps {
  cafe: Cafe | null;
  mode: PanelMode;
  onClose: () => void;
  onSuccess: () => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_COLORS: Record<string, string> = {
  ok:   'bg-green-100 text-green-700',
  low:  'bg-yellow-100 text-yellow-700',
  zero: 'bg-red-100 text-red-700',
};

// ─── Sub-formulários ─────────────────────────────────────────────────────────

// Aba: Entrada de estoque
function TabEntrada({ cafe, onSuccess, onClose }: { cafe: Cafe; onSuccess: () => void; onClose: () => void }) {
  const [qtd, setQtd] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function submit() {
    if (qtd <= 0) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch('/api/estoque-cafe/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cafe_id: cafe.id, quantidade: qtd, motivo }),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ type: 'err', text: d.error }); return; }
      setMsg({ type: 'ok', text: `✅ Adicionado! Novo estoque: ${d.quantidade_nova} un.` });
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 rounded-xl p-3 text-sm">
        <p className="text-amber-600 font-medium">Estoque atual</p>
        <p className="text-2xl font-bold text-amber-800 mt-1">{cafe.estoque_cafe?.[0]?.quantidade ?? 0} <span className="text-sm font-normal">unidades</span></p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade a adicionar *</label>
        <input
          type="number" min={1} value={qtd}
          onChange={(e) => setQtd(Number(e.target.value))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (opcional)</label>
        <input
          type="text" value={motivo} placeholder="Ex: Compra fornecedor, reposição..."
          onChange={(e) => setMotivo(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      {msg && (
        <p className={`text-sm rounded-lg px-3 py-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>
      )}

      <div className="flex gap-2 pt-2">
        <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button
          onClick={submit} disabled={loading || qtd <= 0}
          className="flex-1 bg-amber-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-amber-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando…' : 'Confirmar entrada'}
        </button>
      </div>
    </div>
  );
}

// Aba: Registrar venda rápida
function TabVenda({ cafe, onSuccess, onClose }: { cafe: Cafe; onSuccess: () => void; onClose: () => void }) {
  const qtdDisponivel = cafe.estoque_cafe?.[0]?.quantidade ?? 0;
  const [qtd, setQtd] = useState(1);
  const [preco, setPreco] = useState(cafe.preco_venda);
  const [forma, setForma] = useState<string>('dinheiro');
  const [clienteNome, setClienteNome] = useState('');
  const [desconto, setDesconto] = useState(0);
  const [obs, setObs] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const subtotal = qtd * preco;
  const total = Math.max(0, subtotal - desconto);

  async function submit() {
    if (qtd <= 0 || preco <= 0) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch('/api/vendas/rapida-cafe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cafe_id: cafe.id,
          quantidade: qtd,
          preco_unitario: preco,
          forma_pagamento: forma,
          cliente_nome: clienteNome || undefined,
          desconto,
          observacoes: obs || undefined,
        }),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ type: 'err', text: d.error }); return; }
      setMsg({ type: 'ok', text: `✅ Venda #${d.venda_id} registrada! Restante: ${d.estoque_restante} un.` });
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {qtdDisponivel === 0 && (
        <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-3 py-2">
          ⚠️ Este café não tem estoque disponível.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade *</label>
          <input
            type="number" min={1} max={qtdDisponivel} value={qtd}
            onChange={(e) => setQtd(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Disponível: {qtdDisponivel}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Preço unitário *</label>
          <input
            type="number" min={0} step={0.01} value={preco}
            onChange={(e) => setPreco(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Pagamento</label>
          <select
            value={forma}
            onChange={(e) => setForma(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
          >
            <option value="dinheiro">💵 Dinheiro</option>
            <option value="pix">📱 PIX</option>
            <option value="credito">💳 Crédito</option>
            <option value="debito">💳 Débito</option>
            <option value="boleto">📄 Boleto</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Desconto (R$)</label>
          <input
            type="number" min={0} step={0.01} value={desconto}
            onChange={(e) => setDesconto(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Cliente (opcional)</label>
        <input
          type="text" value={clienteNome} placeholder="Nome do cliente..."
          onChange={(e) => setClienteNome(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
        <input
          type="text" value={obs} placeholder="Opcional..."
          onChange={(e) => setObs(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400"
        />
      </div>

      {/* Resumo */}
      <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
        <div className="flex justify-between text-gray-500">
          <span>Subtotal</span><span>{fmtBRL(subtotal)}</span>
        </div>
        {desconto > 0 && (
          <div className="flex justify-between text-red-500">
            <span>Desconto</span><span>-{fmtBRL(desconto)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-200">
          <span>Total</span><span className="text-amber-700">{fmtBRL(total)}</span>
        </div>
      </div>

      {msg && (
        <p className={`text-sm rounded-lg px-3 py-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button
          onClick={submit} disabled={loading || qtd <= 0 || preco <= 0 || qtdDisponivel < qtd}
          className="flex-1 bg-amber-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-amber-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando…' : 'Registrar venda'}
        </button>
      </div>
    </div>
  );
}

// Aba: Editar / Novo café
function TabEditar({
  cafe, mode, onSuccess, onClose
}: {
  cafe: Cafe | null;
  mode: PanelMode;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const isNew = mode === 'new';

  const [form, setForm] = useState({
    nome: cafe?.nome ?? '',
    tipo_grao: cafe?.tipo_grao ?? '',
    torra: cafe?.torra ?? '',
    origem: cafe?.origem ?? '',
    peso_g: String(cafe?.peso_g ?? '250'),
    preco_custo: String(cafe?.preco_custo ?? ''),
    preco_venda: String(cafe?.preco_venda ?? ''),
    descricao: cafe?.descricao ?? '',
    notas_degustacao: cafe?.notas_degustacao ?? '',
    estoque_inicial: '0',
  });

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function set(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function submit() {
    if (!form.nome.trim() || !form.preco_venda) return;
    setLoading(true);
    setMsg(null);

    const payload = {
      nome: form.nome.trim(),
      tipo_grao: form.tipo_grao || null,
      torra: form.torra || null,
      origem: form.origem || null,
      peso_g: form.peso_g ? Number(form.peso_g) : 250,
      preco_custo: form.preco_custo ? Number(form.preco_custo) : null,
      preco_venda: Number(form.preco_venda),
      descricao: form.descricao || null,
      notas_degustacao: form.notas_degustacao || null,
      ...(isNew ? { estoque_inicial: Number(form.estoque_inicial) } : {}),
    };

    try {
      const url = isNew ? '/api/cafes' : `/api/cafes/${cafe!.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ type: 'err', text: d.error }); return; }
      setMsg({ type: 'ok', text: isNew ? '✅ Café cadastrado com sucesso!' : '✅ Informações atualizadas!' });
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-amber-400';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="space-y-3">
      {/* Nome */}
      <div>
        <label className={labelCls}>Nome *</label>
        <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} className={inputCls} placeholder="Nome do café" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo de grão</label>
          <select value={form.tipo_grao} onChange={(e) => set('tipo_grao', e.target.value)} className={inputCls}>
            <option value="">Selecione...</option>
            <option value="Arábica">Arábica</option>
            <option value="Robusta">Robusta</option>
            <option value="Blend">Blend</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Torra</label>
          <select value={form.torra} onChange={(e) => set('torra', e.target.value)} className={inputCls}>
            <option value="">Selecione...</option>
            <option value="Clara">Clara</option>
            <option value="Média">Média</option>
            <option value="Média-Escura">Média-Escura</option>
            <option value="Escura">Escura</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Origem</label>
          <input type="text" value={form.origem} onChange={(e) => set('origem', e.target.value)} className={inputCls} placeholder="Brasil, Colômbia..." />
        </div>
        <div>
          <label className={labelCls}>Peso (g)</label>
          <input type="number" value={form.peso_g} onChange={(e) => set('peso_g', e.target.value)} className={inputCls} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Preço de custo</label>
          <input type="number" step="0.01" value={form.preco_custo} onChange={(e) => set('preco_custo', e.target.value)} className={inputCls} placeholder="R$ 0,00" />
        </div>
        <div>
          <label className={labelCls}>Preço de venda *</label>
          <input type="number" step="0.01" value={form.preco_venda} onChange={(e) => set('preco_venda', e.target.value)} className={inputCls} placeholder="R$ 0,00" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Descrição</label>
        <textarea rows={2} value={form.descricao} onChange={(e) => set('descricao', e.target.value)} className={inputCls + ' resize-none'} placeholder="Descrição do café..." />
      </div>

      <div>
        <label className={labelCls}>Notas de degustação</label>
        <textarea rows={2} value={form.notas_degustacao} onChange={(e) => set('notas_degustacao', e.target.value)} className={inputCls + ' resize-none'} placeholder="Aromas, acidez, corpo, finalização..." />
      </div>

      {isNew && (
        <div>
          <label className={labelCls}>Estoque inicial</label>
          <input type="number" min={0} value={form.estoque_inicial} onChange={(e) => set('estoque_inicial', e.target.value)} className={inputCls} />
        </div>
      )}

      {msg && (
        <p className={`text-sm rounded-lg px-3 py-2 ${msg.type === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{msg.text}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button onClick={onClose} className="flex-1 border border-gray-200 text-gray-500 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition-colors">
          Cancelar
        </button>
        <button
          onClick={submit}
          disabled={loading || !form.nome.trim() || !form.preco_venda}
          className="flex-1 bg-amber-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-amber-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando…' : isNew ? 'Cadastrar café' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  );
}

// ─── Painel principal ─────────────────────────────────────────────────────────
export default function CoffeePanel({ cafe, mode, onClose, onSuccess }: CoffeePanelProps) {
  const isNew = mode === 'new';

  const tabs: { key: PanelTab; label: string; emoji: string; onlyExisting?: boolean }[] = [
    { key: 'info',    label: 'Detalhes',  emoji: '☕', onlyExisting: true },
    { key: 'entrada', label: 'Entrada',   emoji: '📦', onlyExisting: true },
    { key: 'venda',   label: 'Venda',     emoji: '💰', onlyExisting: true },
    { key: 'editar',  label: isNew ? 'Novo café' : 'Editar', emoji: isNew ? '➕' : '✏️' },
  ];

  const visibleTabs = tabs.filter((t) => !t.onlyExisting || !isNew);
  const [activeTab, setActiveTab] = useState<PanelTab>(isNew ? 'editar' : 'info');

  const overlayRef = useRef<HTMLDivElement>(null);

  const qtd = cafe?.estoque_cafe?.[0]?.quantidade ?? 0;
  const statusKey = qtd === 0 ? 'zero' : qtd < 5 ? 'low' : 'ok';
  const statusLabel = qtd === 0 ? 'Sem estoque' : qtd < 5 ? 'Estoque baixo' : 'Em estoque';

  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center sm:justify-end"
      style={{ backdropFilter: 'blur(2px)' }}
    >
      <div className="w-full sm:w-[420px] sm:h-full bg-white rounded-t-2xl sm:rounded-none sm:rounded-l-2xl flex flex-col shadow-2xl max-h-[85vh] sm:max-h-full animate-slideUp sm:animate-slideLeft overflow-hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Header */}
        <div className="bg-amber-50 px-5 pt-5 pb-0 border-b border-amber-100 shrink-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              {isNew ? (
                <h2 className="text-lg font-bold text-amber-900">➕ Novo café</h2>
              ) : (
                <>
                  <p className="text-xs text-amber-400">#{cafe!.id}</p>
                  <h2 className="text-lg font-bold text-amber-900 leading-tight">{cafe!.nome}</h2>
                  <p className="text-xs text-amber-600 mt-0.5">
                    {cafe!.origem ?? '—'}
                    {cafe!.torra ? ` · Torra ${cafe!.torra}` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[statusKey]}`}>{statusLabel}</span>
                    <span className="text-xs text-amber-600 font-semibold">{fmtBRL(cafe!.preco_venda)}</span>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 shrink-0 mt-0.5"
              aria-label="Fechar"
            >
              ✕
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto scrollbar-none">
            {visibleTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-t-lg border-x border-t transition-colors shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-white border-amber-100 text-amber-800 z-10'
                    : 'bg-transparent border-transparent text-amber-500 hover:text-amber-700'
                }`}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div className="flex-1 overflow-y-auto p-5 pb-20 sm:pb-5">
          {/* ABA INFO */}
          {activeTab === 'info' && cafe && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Estoque', value: `${qtd} un.`, highlight: true },
                  { label: 'Peso', value: `${cafe.peso_g ?? 250}g` },
                  { label: 'Preço custo', value: cafe.preco_custo ? fmtBRL(cafe.preco_custo) : '—' },
                  { label: 'Preço venda', value: fmtBRL(cafe.preco_venda), highlight: true },
                  { label: 'Tipo de grão', value: cafe.tipo_grao ?? '—' },
                  { label: 'Torra', value: cafe.torra ?? '—' },
                  { label: 'Origem', value: cafe.origem ?? '—' },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className={`text-sm font-semibold mt-0.5 ${item.highlight ? 'text-amber-700' : 'text-gray-800'}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {cafe.descricao && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Descrição</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{cafe.descricao}</p>
                </div>
              )}

              {cafe.notas_degustacao && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Notas de degustação</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 italic">{cafe.notas_degustacao}</p>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  onClick={() => setActiveTab('entrada')}
                  className="flex-1 bg-blue-50 text-blue-700 border border-blue-100 rounded-xl py-2.5 text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  📦 Adicionar estoque
                </button>
                <button
                  onClick={() => setActiveTab('venda')}
                  className="flex-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl py-2.5 text-sm font-medium hover:bg-amber-100 transition-colors"
                >
                  💰 Registrar venda
                </button>
              </div>
            </div>
          )}

          {activeTab === 'entrada' && cafe && (
            <TabEntrada cafe={cafe} onSuccess={onSuccess} onClose={onClose} />
          )}

          {activeTab === 'venda' && cafe && (
            <TabVenda cafe={cafe} onSuccess={onSuccess} onClose={onClose} />
          )}

          {activeTab === 'editar' && (
            <TabEditar
              cafe={cafe}
              mode={mode}
              onSuccess={onSuccess}
              onClose={onClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}
