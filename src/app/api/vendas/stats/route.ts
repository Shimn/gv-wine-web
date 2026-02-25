import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from = searchParams.get('from');
    const to   = searchParams.get('to');

    let query = supabase
      .from('vendas')
      .select('id, data_venda, valor_final, forma_pagamento, status, itens_venda(quantidade, preco_unitario, subtotal, vinhos(id, nome))')
      .order('data_venda', { ascending: true });

    if (from) query = query.gte('data_venda', from);
    if (to)   query = query.lte('data_venda', to + 'T23:59:59');

    const { data: vendas, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    type VendaItem = { id: number; quantidade?: number; preco_unitario?: number; subtotal?: number; vinhos?: { id: number; nome?: string } | null };
    type VendaRow = { id: number; data_venda?: string; valor_final?: number; forma_pagamento?: string; status?: string; itens_venda?: VendaItem[] };
    const lista: VendaRow[] = vendas ?? [];

    const concluidas = lista.filter((v) => v.status === 'concluida');
    const canceladas = lista.filter((v) => v.status === 'cancelada');
    const pendentes  = lista.filter((v) => v.status === 'pendente');
    const faturamento = concluidas.reduce((s: number, v) => s + (v.valor_final ?? 0), 0);
    const ticketMedio = concluidas.length ? faturamento / concluidas.length : 0;

    // Faturamento por dia
    const porDia: Record<string, number> = {};
    concluidas.forEach((v) => {
      const dia = v.data_venda?.slice(0, 10);
      if (dia) porDia[dia] = (porDia[dia] ?? 0) + (v.valor_final ?? 0);
    });

    // Por forma de pagamento
    const porPagamento: Record<string, { count: number; total: number }> = {};
    concluidas.forEach((v) => {
      const pg = v.forma_pagamento ?? 'outro';
      if (!porPagamento[pg]) porPagamento[pg] = { count: 0, total: 0 };
      porPagamento[pg].count++;
      porPagamento[pg].total += v.valor_final ?? 0;
    });

    // Top vinhos por receita
    const vinhoMap: Record<string, { nome: string; qtd: number; receita: number }> = {};
    concluidas.forEach((v) => {
      (v.itens_venda ?? []).forEach((item: VendaItem) => {
        const id = String(item.vinhos?.id ?? '?');
        if (!vinhoMap[id]) vinhoMap[id] = { nome: item.vinhos?.nome ?? '?', qtd: 0, receita: 0 };
        vinhoMap[id].qtd     += item.quantidade ?? 0;
        vinhoMap[id].receita += item.subtotal ?? 0;
      });
    });
    const topVinhos = Object.values(vinhoMap)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 5);

    return NextResponse.json({
      totalVendas: lista.length,
      concluidas:  concluidas.length,
      canceladas:  canceladas.length,
      pendentes:   pendentes.length,
      faturamento,
      ticketMedio,
      porDia,
      porPagamento,
      topVinhos,
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
