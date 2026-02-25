import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/estoque-cafe/entrada — adiciona unidades ao estoque de café
export async function POST(req: NextRequest) {
  try {
    const { cafe_id, quantidade, motivo, localizacao } = await req.json();

    if (!cafe_id || !quantidade || quantidade <= 0) {
      return NextResponse.json({ error: 'cafe_id e quantidade > 0 são obrigatórios.' }, { status: 400 });
    }

    // Buscar estoque atual
    const { data: estoqueAtual, error: errBusca } = await supabase
      .from('estoque_cafe')
      .select('id, quantidade, localizacao')
      .eq('cafe_id', cafe_id)
      .maybeSingle();

    if (errBusca) return NextResponse.json({ error: errBusca.message }, { status: 500 });

    const qtdAnterior = estoqueAtual?.quantidade ?? 0;
    const qtdNova = qtdAnterior + quantidade;

    if (estoqueAtual) {
      const { error } = await supabase
        .from('estoque_cafe')
        .update({
          quantidade: qtdNova,
          localizacao: localizacao || estoqueAtual.localizacao,
        })
        .eq('cafe_id', cafe_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabase
        .from('estoque_cafe')
        .insert({ cafe_id, quantidade: qtdNova, localizacao });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Registrar movimentação
    await supabase.from('movimentacoes_estoque_cafe').insert({
      cafe_id,
      tipo: 'entrada',
      quantidade,
      quantidade_anterior: qtdAnterior,
      quantidade_nova: qtdNova,
      motivo: motivo || 'Entrada manual via painel web',
    });

    return NextResponse.json({
      message: 'Estoque de café atualizado.',
      quantidade_anterior: qtdAnterior,
      quantidade_nova: qtdNova,
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
