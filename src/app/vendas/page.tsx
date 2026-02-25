"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

// ----------------------------------------------------------------
// Tipos
// ----------------------------------------------------------------
interface Venda {
  id: number;
  data_venda: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
  forma_pagamento?: string;
  status: string;
  observacoes?: string;
  clientes?: { id: number; nome: string };
  itens_venda?: { id: number; quantidade: number; preco_unitario: number; subtotal: number; vinhos?: { id: number; nome: string; safra?: number }; cafes?: { id: number; nome: string } }[];
}

interface Stats {
  totalVendas: number;
  concluidas: number;
  canceladas: number;
  pendentes: number;
  faturamento: number;
  ticketMedio: number;
  porDia: Record<string, number>;
  porPagamento: Record<string, { count: number; total: number }>;
  topVinhos: { nome: string; qtd: number; receita: number }[];
  topCafes: { nome: string; qtd: number; receita: number }[];
}

// ----------------------------------------------------------------
// Constantes
// ----------------------------------------------------------------
const STATUS_CFG: Record<string, { label: string; color: string }> = {
  concluida: { label: "Concluída", color: "bg-green-100 text-green-700" },
  pendente:  { label: "Pendente",  color: "bg-yellow-100 text-yellow-700" },
  cancelada: { label: "Cancelada", color: "bg-red-100 text-red-700" },
};

const PG_ICON: Record<string, string> = {
  dinheiro: "💵", pix: "📱", credito: "💳", debito: "💳", boleto: "📄",
};

const PG_LABEL: Record<string, string> = {
  dinheiro: "Dinheiro", pix: "PIX", credito: "Crédito", debito: "Débito", boleto: "Boleto",
};

const PERIODS = [
  { key: "7d",  label: "7 dias" },
  { key: "30d", label: "30 dias" },
  { key: "3m",  label: "3 meses" },
  { key: "1y",  label: "1 ano" },
  { key: "custom", label: "Personalizado" },
] as const;

type PeriodKey = typeof PERIODS[number]["key"];

// ----------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------
function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

function periodDates(key: PeriodKey): { from: string; to: string } {
  const now = new Date();
  const to  = toISO(now);
  if (key === "7d")  { const d = new Date(now); d.setDate(d.getDate() - 6);   return { from: toISO(d), to }; }
  if (key === "30d") { const d = new Date(now); d.setDate(d.getDate() - 29);  return { from: toISO(d), to }; }
  if (key === "3m")  { const d = new Date(now); d.setMonth(d.getMonth() - 3); return { from: toISO(d), to }; }
  if (key === "1y")  { const d = new Date(now); d.setFullYear(d.getFullYear() - 1); return { from: toISO(d), to }; }
  return { from: toISO(now), to };
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// ----------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------
export default function VendasPage() {
  const [period, setPeriod]     = useState<PeriodKey>("30d");
  const [customFrom, setCustomFrom] = useState(() => toISO(new Date(Date.now() - 30 * 86400000)));
  const [customTo,   setCustomTo]   = useState(() => toISO(new Date()));
  const [statusFilter, setStatusFilter] = useState("todos");

  const [vendas, setVendas]     = useState<Venda[]>([]);
  const [stats,  setStats]      = useState<Stats | null>(null);
  const [loadingVendas, setLoadingVendas] = useState(true);
  const [loadingStats,  setLoadingStats]  = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { from, to } = useMemo(() => {
    if (period === "custom") return { from: customFrom, to: customTo };
    return periodDates(period);
  }, [period, customFrom, customTo]);

  const fetchData = useCallback(() => {
    setLoadingVendas(true);
    setLoadingStats(true);

    const qs  = new URLSearchParams({ from, to });
    const qss = new URLSearchParams({ from, to });
    if (statusFilter !== "todos") qs.set("status", statusFilter);

    fetch("/api/vendas?" + qs)
      .then((r) => r.json())
      .then((d) => setVendas(d.vendas ?? []))
      .finally(() => setLoadingVendas(false));

    fetch("/api/vendas/stats?" + qss)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .finally(() => setLoadingStats(false));
  }, [from, to, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Barras do gráfico
  const chartData = useMemo(() => {
    if (!stats?.porDia) return [];
    const entries = Object.entries(stats.porDia).sort(([a], [b]) => a.localeCompare(b));
    const max = Math.max(...entries.map(([, v]) => v), 1);
    return entries.map(([dia, val]) => ({
      dia,
      label: new Date(dia + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      val,
      pct: Math.round((val / max) * 100),
    }));
  }, [stats]);

  const pgTotal = useMemo(() => {
    if (!stats?.porPagamento) return 0;
    return Object.values(stats.porPagamento).reduce((s, v) => s + v.total, 0) || 1;
  }, [stats]);


  return (
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      {/* ── HEADER ─────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h1 className="text-lg font-bold text-gray-900">💰 Vendas</h1>

          {/* Filtro de período */}
          <div className="flex items-center gap-1 flex-wrap">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  period === p.key
                    ? "bg-wine-700 text-white border-wine-700"
                    : "bg-white text-gray-500 border-gray-200 hover:border-wine-300"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Datas personalizadas */}
        {period === "custom" && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
              className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-wine-400" />
            <span className="text-xs text-gray-400">até</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
              className="flex-1 min-w-0 text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-wine-400" />
          </div>
        )}
      </div>

      {/* ── CONTEÚDO SCROLLÁVEL ─────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* ── KPI Cards ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Faturamento",  value: fmtBRL(stats?.faturamento ?? 0),  sub: "vendas concluídas",  color: "text-wine-700",  bg: "bg-wine-50"  },
            { label: "Ticket médio", value: fmtBRL(stats?.ticketMedio ?? 0),  sub: `${stats?.concluidas ?? 0} vendas`,     color: "text-blue-700",  bg: "bg-blue-50"  },
            { label: "Concluídas",   value: String(stats?.concluidas ?? 0),   sub: `de ${stats?.totalVendas ?? 0} total`, color: "text-green-700", bg: "bg-green-50" },
            { label: "Canceladas",   value: String(stats?.canceladas ?? 0),   sub: `${stats?.pendentes ?? 0} pendentes`,  color: "text-red-700",   bg: "bg-red-50"   },
          ].map((c) => (
            <div key={c.label} className={`${c.bg} rounded-xl p-3`}>
              <p className="text-xs text-gray-500">{c.label}</p>
              <p className={`text-lg font-bold ${c.color} leading-tight mt-0.5`}>
                {loadingStats ? <span className="inline-block w-16 h-5 bg-gray-200 rounded animate-pulse" /> : c.value}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Gráfico de barras ─── */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">📈 Faturamento por dia</p>
            <div className="flex items-end gap-1 h-28 overflow-x-auto pb-1">
              {chartData.map((d) => (
                <div key={d.dia} className="flex flex-col items-center gap-1 flex-shrink-0" style={{ minWidth: chartData.length > 20 ? 20 : 36 }}>
                  <span className="text-[9px] text-gray-400 whitespace-nowrap">
                    {d.pct === 100 ? fmtBRL(d.val) : ""}
                  </span>
                  <div
                    title={`${d.dia}: ${fmtBRL(d.val)}`}
                    className="w-full bg-wine-600 hover:bg-wine-500 transition-colors rounded-t-sm cursor-default"
                    style={{ height: `${Math.max(d.pct, 4)}%` }}
                  />
                  <span className="text-[9px] text-gray-400 leading-tight text-center">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Linha inferior: Pagamentos + Top Vinhos ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          {/* Forma de pagamento */}
          {stats && Object.keys(stats.porPagamento).length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">💳 Por forma de pagamento</p>
              <div className="space-y-2">
                {Object.entries(stats.porPagamento)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([pg, info]) => {
                    const pct = Math.round((info.total / pgTotal) * 100);
                    return (
                      <div key={pg}>
                        <div className="flex items-center justify-between text-xs mb-0.5">
                          <span className="flex items-center gap-1">
                            <span>{PG_ICON[pg] ?? "💳"}</span>
                            <span className="text-gray-600">{PG_LABEL[pg] ?? pg}</span>
                            <span className="text-gray-400">({info.count})</span>
                          </span>
                          <span className="font-semibold text-gray-700">{fmtBRL(info.total)}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full bg-wine-500 rounded-full" style={{ width: pct + "%" }} />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Top vinhos */}
          {stats && stats.topVinhos.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">🍷 Top vinhos (por receita)</p>
              <div className="space-y-2">
                {stats.topVinhos.map((v, i) => {
                  const maxReceita = stats.topVinhos[0]?.receita || 1;
                  return (
                    <div key={v.nome}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-gray-600 truncate flex-1">
                          <span className="text-gray-400 mr-1">{i + 1}.</span>{v.nome}
                        </span>
                        <span className="font-semibold text-gray-700 shrink-0 ml-2">{fmtBRL(v.receita)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: Math.round((v.receita / maxReceita) * 100) + "%" }} />
                      </div>
                      <p className="text-[10px] text-gray-400">{v.qtd} unidades vendidas</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Top cafés */}
          {stats && stats.topCafes && stats.topCafes.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">☕ Top cafés (por receita)</p>
              <div className="space-y-2">
                {stats.topCafes.map((c, i) => {
                  const maxReceita = stats.topCafes[0]?.receita || 1;
                  return (
                    <div key={c.nome}>
                      <div className="flex items-center justify-between text-xs mb-0.5">
                        <span className="text-gray-600 truncate flex-1">
                          <span className="text-gray-400 mr-1">{i + 1}.</span>{c.nome}
                        </span>
                        <span className="font-semibold text-gray-700 shrink-0 ml-2">{fmtBRL(c.receita)}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full">
                        <div className="h-full bg-amber-400 rounded-full" style={{ width: Math.round((c.receita / maxReceita) * 100) + "%" }} />
                      </div>
                      <p className="text-[10px] text-gray-400">{c.qtd} unidades vendidas</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── Lista de Vendas ─── */}
        <div className="bg-white rounded-xl border border-gray-100">
          {/* Header da lista com filtro de status */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-gray-50">
            <p className="text-sm font-semibold text-gray-700">Detalhes das vendas</p>
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {["todos", "concluida", "pendente", "cancelada"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`shrink-0 text-xs px-2 py-1 rounded-full border transition-colors ${
                    statusFilter === s
                      ? "bg-wine-700 text-white border-wine-700"
                      : "bg-white text-gray-400 border-gray-200 hover:border-wine-300"
                  }`}
                >
                  {s === "todos" ? "Todos" : STATUS_CFG[s]?.label}
                </button>
              ))}
            </div>
          </div>

          {/* Itens */}
          <div className="divide-y divide-gray-50">
            {loadingVendas && (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-2 border-wine-700 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {!loadingVendas && vendas.length === 0 && (
              <p className="text-center text-gray-400 py-8 text-sm">Nenhuma venda no período.</p>
            )}
            {vendas.map((venda) => {
              const cfg    = STATUS_CFG[venda.status] ?? STATUS_CFG.pendente;
              const pgIcon = PG_ICON[venda.forma_pagamento ?? ""] ?? "💳";
              const open   = expandedId === venda.id;

              return (
                <div key={venda.id}>
                  <button
                    onClick={() => setExpandedId(open ? null : venda.id)}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-gray-400 shrink-0">#{venda.id}</span>
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {venda.clientes?.nome ?? "Cliente não informado"}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-sm font-bold text-wine-700">{fmtBRL(venda.valor_final)}</span>
                        <span className="text-gray-300">{open ? "▲" : "▼"}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>{fmtDate(venda.data_venda)}</span>
                      <span>{pgIcon} {PG_LABEL[venda.forma_pagamento ?? ""] ?? venda.forma_pagamento}</span>
                      {venda.desconto > 0 && <span className="text-red-400">-{fmtBRL(venda.desconto)}</span>}
                    </div>
                  </button>

                  {/* Itens expandidos */}
                  {open && venda.itens_venda && venda.itens_venda.length > 0 && (
                    <div className="px-4 pb-3 bg-gray-50 border-t border-gray-100">
                      <p className="text-xs text-gray-500 font-medium py-2">Itens da venda:</p>
                      <div className="space-y-1">
                        {venda.itens_venda.map((item) => (
                          <div key={item.id} className="flex items-start justify-between gap-2 text-xs">
                            <span className="text-gray-700 flex-1 min-w-0">
                              {item.quantidade}x {item.vinhos?.nome ?? item.cafes?.nome ?? 'Produto'}{item.vinhos?.safra ? ` (${item.vinhos.safra})` : ''}
                              {item.cafes && <span className="text-amber-500 ml-1 text-[10px]">☕</span>}
                            </span>
                            <span className="text-gray-500 shrink-0 text-right">
                              {fmtBRL(item.preco_unitario)} ×{item.quantidade}<br />
                              <span className="font-medium text-gray-700">{fmtBRL(item.subtotal)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                      {venda.desconto > 0 && (
                        <div className="flex justify-between text-xs mt-2 pt-2 border-t border-gray-200">
                          <span className="text-gray-500">Subtotal</span>
                          <span>{fmtBRL(venda.valor_total)}</span>
                        </div>
                      )}
                      {venda.desconto > 0 && (
                        <div className="flex justify-between text-xs">
                          <span className="text-red-500">Desconto</span>
                          <span className="text-red-500">-{fmtBRL(venda.desconto)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-bold mt-1">
                        <span>Total</span>
                        <span className="text-wine-700">{fmtBRL(venda.valor_final)}</span>
                      </div>
                      {venda.observacoes && (
                        <p className="text-xs text-gray-400 mt-2 italic">{venda.observacoes}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
