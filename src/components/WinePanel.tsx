'use client';

import { useEffect, useRef, useState } from 'react';
import type { Vinho } from '@/lib/types';

// ─── Tipos locais ────────────────────────────────────────────────────────────
interface SelectOption { id: number; nome: string }

type PanelTab = 'info' | 'entrada' | 'venda' | 'editar';
type PanelMode = 'view' | 'new'; // view = vinho existente, new = criar vinho

interface WinePanelProps {
  vinho: Vinho | null;          // null = modo "novo vinho"
  mode: PanelMode;
  onClose: () => void;
  onSuccess: () => void;        // recarrega lista após operação
  categorias: SelectOption[];
  produtores: SelectOption[];
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
function TabEntrada({ vinho, onSuccess, onClose }: { vinho: Vinho; onSuccess: () => void; onClose: () => void }) {
  const [qtd, setQtd] = useState(1);
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  async function submit() {
    if (qtd <= 0) return;
    setLoading(true);
    setMsg(null);
    try {
      const r = await fetch('/api/estoque/entrada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vinho_id: vinho.id, quantidade: qtd, motivo }),
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
      <div className="bg-blue-50 rounded-xl p-3 text-sm">
        <p className="text-blue-600 font-medium">Estoque atual</p>
        <p className="text-2xl font-bold text-blue-800 mt-1">{vinho.estoque?.[0]?.quantidade ?? 0} <span className="text-sm font-normal">unidades</span></p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade a adicionar *</label>
        <input
          type="number" min={1} value={qtd}
          onChange={(e) => setQtd(Number(e.target.value))}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Motivo (opcional)</label>
        <input
          type="text" value={motivo} placeholder="Ex: Compra fornecedor, reposição..."
          onChange={(e) => setMotivo(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
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
          className="flex-1 bg-wine-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-wine-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando…' : 'Confirmar entrada'}
        </button>
      </div>
    </div>
  );
}

// Aba: Registrar venda rápida
function TabVenda({ vinho, onSuccess, onClose }: { vinho: Vinho; onSuccess: () => void; onClose: () => void }) {
  const qtdDisponivel = vinho.estoque?.[0]?.quantidade ?? 0;
  const [qtd, setQtd] = useState(1);
  const [preco, setPreco] = useState(vinho.preco_venda);
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
      const r = await fetch('/api/vendas/rapida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vinho_id: vinho.id,
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
          ⚠️ Este vinho não tem estoque disponível.
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Quantidade *</label>
          <input
            type="number" min={1} max={qtdDisponivel} value={qtd}
            onChange={(e) => setQtd(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
          />
          <p className="text-[10px] text-gray-400 mt-0.5">Disponível: {qtdDisponivel}</p>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Preço unitário *</label>
          <input
            type="number" min={0} step={0.01} value={preco}
            onChange={(e) => setPreco(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Pagamento</label>
          <select
            value={forma}
            onChange={(e) => setForma(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
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
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Cliente (opcional)</label>
        <input
          type="text" value={clienteNome} placeholder="Nome do cliente..."
          onChange={(e) => setClienteNome(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Observações</label>
        <input
          type="text" value={obs} placeholder="Opcional..."
          onChange={(e) => setObs(e.target.value)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400"
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
          <span>Total</span><span className="text-wine-700">{fmtBRL(total)}</span>
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
          className="flex-1 bg-wine-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-wine-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando…' : 'Registrar venda'}
        </button>
      </div>
    </div>
  );
}

// Aba: Editar / Novo vinho
function TabEditar({
  vinho, mode, onSuccess, onClose, categorias, produtores
}: {
  vinho: Vinho | null;
  mode: PanelMode;
  onSuccess: () => void;
  onClose: () => void;
  categorias: SelectOption[];
  produtores: SelectOption[];
}) {
  const isNew = mode === 'new';

  const [form, setForm] = useState({
    nome: vinho?.nome ?? '',
    safra: String(vinho?.safra ?? ''),
    tipo_uva: vinho?.tipo_uva ?? '',
    teor_alcoolico: String(vinho?.teor_alcoolico ?? ''),
    volume_ml: String(vinho?.volume_ml ?? '750'),
    preco_custo: String(vinho?.preco_custo ?? ''),
    preco_venda: String(vinho?.preco_venda ?? ''),
    descricao: vinho?.descricao ?? '',
    notas_degustacao: vinho?.notas_degustacao ?? '',
    produtor_id: String(vinho?.produtores?.id ?? vinho?.produtor_id ?? ''),
    categoria_id: String(vinho?.categorias?.id ?? vinho?.categoria_id ?? ''),
    estoque_inicial: '0',
  });

  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  function set(field: string, val: string) {
    setForm((f) => ({ ...f, [field]: val }));
  }

  async function handleDelete() {
    if (!vinho) return;
    setDeleting(true);
    setMsg(null);
    try {
      const r = await fetch(`/api/vinhos/${vinho.id}`, { method: 'DELETE' });
      if (!r.ok) { const d = await r.json(); setMsg({ type: 'err', text: d.error ?? 'Erro ao excluir.' }); return; }
      onSuccess();
      onClose();
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function submit() {
    if (!form.nome.trim() || !form.preco_venda) return;
    setLoading(true);
    setMsg(null);

    const payload = {
      nome: form.nome.trim(),
      safra: form.safra ? Number(form.safra) : null,
      tipo_uva: form.tipo_uva || null,
      teor_alcoolico: form.teor_alcoolico ? Number(form.teor_alcoolico) : null,
      volume_ml: form.volume_ml ? Number(form.volume_ml) : 750,
      preco_custo: form.preco_custo ? Number(form.preco_custo) : null,
      preco_venda: Number(form.preco_venda),
      descricao: form.descricao || null,
      notas_degustacao: form.notas_degustacao || null,
      produtor_id: form.produtor_id ? Number(form.produtor_id) : null,
      categoria_id: form.categoria_id ? Number(form.categoria_id) : null,
      ...(isNew ? { estoque_inicial: Number(form.estoque_inicial) } : {}),
    };

    try {
      const url = isNew ? '/api/vinhos' : `/api/vinhos/${vinho!.id}`;
      const method = isNew ? 'POST' : 'PUT';
      const r = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) { setMsg({ type: 'err', text: d.error }); return; }
      setMsg({ type: 'ok', text: isNew ? '✅ Vinho cadastrado com sucesso!' : '✅ Informações atualizadas!' });
      onSuccess();
    } finally {
      setLoading(false);
    }
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-wine-400';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="space-y-3">
      {/* Nome */}
      <div>
        <label className={labelCls}>Nome *</label>
        <input type="text" value={form.nome} onChange={(e) => set('nome', e.target.value)} className={inputCls} placeholder="Nome do vinho" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Safra</label>
          <input type="number" value={form.safra} onChange={(e) => set('safra', e.target.value)} className={inputCls} placeholder="Ex: 2020" />
        </div>
        <div>
          <label className={labelCls}>Volume (ml)</label>
          <input type="number" value={form.volume_ml} onChange={(e) => set('volume_ml', e.target.value)} className={inputCls} />
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Tipo de uva</label>
          <input type="text" value={form.tipo_uva} onChange={(e) => set('tipo_uva', e.target.value)} className={inputCls} placeholder="Merlot, Cabernet..." />
        </div>
        <div>
          <label className={labelCls}>Teor alcoólico (%)</label>
          <input type="number" step="0.1" value={form.teor_alcoolico} onChange={(e) => set('teor_alcoolico', e.target.value)} className={inputCls} placeholder="13.5" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Categoria</label>
          <select value={form.categoria_id} onChange={(e) => set('categoria_id', e.target.value)} className={inputCls}>
            <option value="">Sem categoria</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls}>Produtor</label>
          <select value={form.produtor_id} onChange={(e) => set('produtor_id', e.target.value)} className={inputCls}>
            <option value="">Sem produtor</option>
            {produtores.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Descrição</label>
        <textarea rows={2} value={form.descricao} onChange={(e) => set('descricao', e.target.value)} className={inputCls + ' resize-none'} placeholder="Descrição do vinho..." />
      </div>

      <div>
        <label className={labelCls}>Notas de degustação</label>
        <textarea rows={2} value={form.notas_degustacao} onChange={(e) => set('notas_degustacao', e.target.value)} className={inputCls + ' resize-none'} placeholder="Aromas, sabores, finalização..." />
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
          className="flex-1 bg-wine-700 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-wine-800 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando…' : isNew ? 'Cadastrar vinho' : 'Salvar alterações'}
        </button>
      </div>

      {/* Botão excluir — só no modo edição */}
      {!isNew && vinho && (
        <div className="pt-3 border-t border-gray-100">
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="w-full text-xs text-red-400 hover:text-red-600 transition-colors py-2"
            >
              🗑️ Excluir este vinho
            </button>
          ) : (
            <div className="bg-red-50 rounded-xl p-3 space-y-2">
              <p className="text-xs text-red-700 font-medium">Tem certeza? Esta ação é irreversível.</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="flex-1 border border-gray-200 text-gray-500 rounded-lg py-2 text-xs hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white rounded-lg py-2 text-xs font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Excluindo…' : 'Confirmar exclusão'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Painel principal ─────────────────────────────────────────────────────────
export default function WinePanel({ vinho, mode, onClose, onSuccess, categorias, produtores }: WinePanelProps) {
  const isNew = mode === 'new';

  const tabs: { key: PanelTab; label: string; emoji: string; onlyExisting?: boolean }[] = [
    { key: 'info',    label: 'Detalhes',  emoji: '🍷', onlyExisting: true },
    { key: 'entrada', label: 'Entrada',   emoji: '📦', onlyExisting: true },
    { key: 'venda',   label: 'Venda',     emoji: '💰', onlyExisting: true },
    { key: 'editar',  label: isNew ? 'Novo vinho' : 'Editar', emoji: isNew ? '➕' : '✏️' },
  ];

  const visibleTabs = tabs.filter((t) => !t.onlyExisting || !isNew);
  const [activeTab, setActiveTab] = useState<PanelTab>(isNew ? 'editar' : 'info');

  const overlayRef = useRef<HTMLDivElement>(null);

  const qtd = vinho?.estoque?.[0]?.quantidade ?? 0;
  const statusKey = qtd === 0 ? 'zero' : qtd < 5 ? 'low' : 'ok';
  const statusLabel = qtd === 0 ? 'Sem estoque' : qtd < 5 ? 'Estoque baixo' : 'Em estoque';

  // Fechar ao clicar no overlay
  function handleOverlayClick(e: React.MouseEvent) {
    if (e.target === overlayRef.current) onClose();
  }

  // Fechar com Esc
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
      {/* Drawer */}
      <div className="w-full sm:w-[420px] sm:h-full bg-white rounded-t-2xl sm:rounded-none sm:rounded-l-2xl flex flex-col shadow-2xl max-h-[85vh] sm:max-h-full animate-slideUp sm:animate-slideLeft overflow-hidden"
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >

        {/* Header do painel */}
        <div className="bg-wine-50 px-5 pt-5 pb-0 border-b border-wine-100 shrink-0">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              {isNew ? (
                <h2 className="text-lg font-bold text-wine-900">➕ Novo vinho</h2>
              ) : (
                <>
                  <p className="text-xs text-wine-400">#{vinho!.id}</p>
                  <h2 className="text-lg font-bold text-wine-900 leading-tight">{vinho!.nome}</h2>
                  <p className="text-xs text-wine-600 mt-0.5">
                    {vinho!.produtores?.nome ?? '—'}
                    {vinho!.safra ? ` · ${vinho!.safra}` : ''}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[statusKey]}`}>{statusLabel}</span>
                    <span className="text-xs text-wine-600 font-semibold">{fmtBRL(vinho!.preco_venda)}</span>
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
                    ? 'bg-white border-wine-100 text-wine-800 z-10'
                    : 'bg-transparent border-transparent text-wine-500 hover:text-wine-700'
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
          {activeTab === 'info' && vinho && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Estoque', value: `${qtd} un.`, highlight: true },
                  { label: 'Volume', value: `${vinho.volume_ml ?? 750} ml` },
                  { label: 'Preço custo', value: vinho.preco_custo ? fmtBRL(vinho.preco_custo) : '—' },
                  { label: 'Preço venda', value: fmtBRL(vinho.preco_venda), highlight: true },
                  { label: 'Categoria', value: vinho.categorias?.nome ?? '—' },
                  { label: 'Tipo de uva', value: vinho.tipo_uva ?? '—' },
                  { label: 'Safra', value: vinho.safra ? String(vinho.safra) : '—' },
                  { label: 'Teor alcoólico', value: vinho.teor_alcoolico ? `${vinho.teor_alcoolico}%` : '—' },
                ].map((item) => (
                  <div key={item.label} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-400">{item.label}</p>
                    <p className={`text-sm font-semibold mt-0.5 ${item.highlight ? 'text-wine-700' : 'text-gray-800'}`}>{item.value}</p>
                  </div>
                ))}
              </div>

              {vinho.descricao && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Descrição</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{vinho.descricao}</p>
                </div>
              )}

              {vinho.notas_degustacao && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Notas de degustação</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 italic">{vinho.notas_degustacao}</p>
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
                  className="flex-1 bg-wine-50 text-wine-700 border border-wine-100 rounded-xl py-2.5 text-sm font-medium hover:bg-wine-100 transition-colors"
                >
                  💰 Registrar venda
                </button>
              </div>
            </div>
          )}

          {/* ABA ENTRADA */}
          {activeTab === 'entrada' && vinho && (
            <TabEntrada vinho={vinho} onSuccess={onSuccess} onClose={onClose} />
          )}

          {/* ABA VENDA */}
          {activeTab === 'venda' && vinho && (
            <TabVenda vinho={vinho} onSuccess={onSuccess} onClose={onClose} />
          )}

          {/* ABA EDITAR / NOVO */}
          {activeTab === 'editar' && (
            <TabEditar
              vinho={vinho}
              mode={mode}
              onSuccess={onSuccess}
              onClose={onClose}
              categorias={categorias}
              produtores={produtores}
            />
          )}
        </div>
      </div>
    </div>
  );
}
