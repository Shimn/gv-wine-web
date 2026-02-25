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
          vinhos(id, nome, safra)
        )
      `)
      .order('data_venda', { ascending: false })
      .limit(200);

    if (from)   query = (query as any).gte('data_venda', from);
    if (to)     query = (query as any).lte('data_venda', to + 'T23:59:59');
    if (status && status !== 'todos') query = (query as any).eq('status', status);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ vendas: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
