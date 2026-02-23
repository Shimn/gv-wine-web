import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('vendas')
      .select(`
        id, data_venda, valor_total, desconto, valor_final,
        forma_pagamento, status, observacoes,
        clientes(nome)
      `)
      .order('data_venda', { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ vendas: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
