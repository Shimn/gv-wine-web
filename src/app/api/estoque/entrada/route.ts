import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/estoque/entrada — adiciona unidades ao estoque
export async function POST(req: NextRequest) {
  try {
    const { vinho_id, quantidade, motivo, localizacao } = await req.json();

    if (!vinho_id || !quantidade || quantidade <= 0) {
      return NextResponse.json({ error: 'vinho_id e quantidade > 0 são obrigatórios.' }, { status: 400 });
    }

    // Buscar estoque atual
    const { data: estoqueAtual, error: errBusca } = await supabase
      .from('estoque')
      .select('id, quantidade, localizacao')
      .eq('vinho_id', vinho_id)
      .maybeSingle();

    if (errBusca) return NextResponse.json({ error: errBusca.message }, { status: 500 });

    const qtdAnterior = estoqueAtual?.quantidade ?? 0;
    const qtdNova = qtdAnterior + quantidade;

    if (estoqueAtual) {
      // Atualizar existente
      const { error } = await supabase
        .from('estoque')
        .update({
          quantidade: qtdNova,
          localizacao: localizacao || estoqueAtual.localizacao,
        })
        .eq('vinho_id', vinho_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      // Criar novo registro
      const { error } = await supabase
        .from('estoque')
        .insert({ vinho_id, quantidade: qtdNova, localizacao });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Registrar movimentação
    await supabase.from('movimentacoes_estoque').insert({
      vinho_id,
      tipo: 'entrada',
      quantidade,
      quantidade_anterior: qtdAnterior,
      quantidade_nova: qtdNova,
      motivo: motivo || 'Entrada manual via painel web',
    });

    return NextResponse.json({
      message: 'Estoque atualizado.',
      quantidade_anterior: qtdAnterior,
      quantidade_nova: qtdNova,
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
