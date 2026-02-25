import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/vendas?from=2026-01-01&to=2026-01-31&status=concluida
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const from   = searchParams.get('from');
    const to     = searchParams.get('to');
    const status = searchParams.get('status');

    let query = supabase
      .from('vendas')
      .select(`
        id, data_venda, valor_total, desconto, valor_final,
        forma_pagamento, status, observacoes,
        clientes(id, nome),
        itens_venda(
          id, quantidade, preco_unitario, subtotal,
          vinhos(id, nome, safra),
          cafes(id, nome)
        )
      `)
      .order('data_venda', { ascending: false })
      .limit(200);

    if (from)   query = query.gte('data_venda', from);
    if (to)     query = query.lte('data_venda', to + 'T23:59:59');
    if (status && status !== 'todos') query = query.eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ vendas: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// DELETE /api/vendas — limpa todas as vendas (dev only)
export async function DELETE() {
  try {
    // Primeiro remove itens_venda (FK)
    const { error: errItens } = await supabase.from('itens_venda').delete().neq('id', 0);
    if (errItens) return NextResponse.json({ error: errItens.message }, { status: 500 });

    const { error } = await supabase.from('vendas').delete().neq('id', 0);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ message: 'Todas as vendas foram removidas.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
