import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Params { params: Promise<{ id: string }> }

// PUT /api/cafes/[id] — atualiza informações do café (e opcionalmente quantidade)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = Number(id);
    const body = await req.json();
    const {
      nome, tipo_grao, torra, formato, origem, peso_g,
      preco_custo, preco_venda, descricao, notas_degustacao, quantidade,
    } = body;

    if (!nome || !preco_venda) {
      return NextResponse.json({ error: 'Nome e preço de venda são obrigatórios.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('cafes')
      .update({
        nome,
        tipo_grao: tipo_grao || null,
        torra: torra || null,
        formato: formato || null,
        origem: origem || null,
        peso_g: peso_g || 250,
        preco_custo: preco_custo || null,
        preco_venda,
        descricao: descricao || null,
        notas_degustacao: notas_degustacao || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', numId)
      .select('id, nome')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Se quantidade foi enviada, atualizar estoque e registrar movimentação
    if (quantidade !== undefined && quantidade !== null) {
      const novaQtd = Number(quantidade);
      const { data: est } = await supabase.from('estoque_cafe').select('quantidade').eq('cafe_id', numId).single();
      const qtdAnterior = est?.quantidade ?? 0;

      if (novaQtd !== qtdAnterior) {
        await supabase.from('estoque_cafe').update({ quantidade: novaQtd, updated_at: new Date().toISOString() }).eq('cafe_id', numId);
        await supabase.from('movimentacoes_estoque_cafe').insert({
          cafe_id: numId,
          tipo: 'ajuste',
          quantidade: Math.abs(novaQtd - qtdAnterior),
          quantidade_anterior: qtdAnterior,
          quantidade_nova: novaQtd,
          motivo: `Ajuste manual via edição: ${qtdAnterior} → ${novaQtd}`,
        });
      }
    }

    return NextResponse.json({ cafe: data, message: 'Café atualizado com sucesso.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// DELETE /api/cafes/[id] — remove café, preserva histórico
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = Number(id);

    // Buscar nome e quantidade atual antes de deletar
    const { data: cafe } = await supabase.from('cafes').select('nome').eq('id', numId).single();
    const { data: est } = await supabase.from('estoque_cafe').select('quantidade').eq('cafe_id', numId).single();
    const nomeCafe = cafe?.nome ?? `Café #${id}`;
    const qtdAtual = est?.quantidade ?? 0;

    // Atualizar motivo nas movimentações sem motivo para preservar nome do produto
    await supabase
      .from('movimentacoes_estoque_cafe')
      .update({ cafe_id: null, motivo: `[${nomeCafe}] ` })
      .eq('cafe_id', numId)
      .is('motivo', null);
    await supabase
      .from('movimentacoes_estoque_cafe')
      .update({ cafe_id: null })
      .eq('cafe_id', numId);

    // Registrar movimentação de remoção
    await supabase.from('movimentacoes_estoque_cafe').insert({
      cafe_id: null,
      tipo: 'saida',
      quantidade: qtdAtual,
      quantidade_anterior: qtdAtual,
      quantidade_nova: 0,
      motivo: `Produto removido do sistema: ${nomeCafe}`,
    });

    // Nullificar FKs em itens_venda
    await supabase.from('itens_venda').update({ cafe_id: null }).eq('cafe_id', numId);

    // Deletar registro de estoque e o produto
    await supabase.from('estoque_cafe').delete().eq('cafe_id', numId);
    const { error } = await supabase.from('cafes').delete().eq('id', numId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Café removido.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
