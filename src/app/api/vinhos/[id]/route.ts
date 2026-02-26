import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Params { params: Promise<{ id: string }> }

// PUT /api/vinhos/[id] — atualiza informações do vinho (e opcionalmente quantidade)
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = Number(id);
    const body = await req.json();
    const {
      nome, safra, tipo_uva, teor_alcoolico, volume_ml,
      preco_custo, preco_venda, descricao, notas_degustacao,
      produtor_id, categoria_id, quantidade,
    } = body;

    if (!nome || !preco_venda) {
      return NextResponse.json({ error: 'Nome e preço de venda são obrigatórios.' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('vinhos')
      .update({
        nome,
        safra: safra || null,
        tipo_uva: tipo_uva || null,
        teor_alcoolico: teor_alcoolico || null,
        volume_ml: volume_ml || 750,
        preco_custo: preco_custo || null,
        preco_venda,
        descricao: descricao || null,
        notas_degustacao: notas_degustacao || null,
        produtor_id: produtor_id || null,
        categoria_id: categoria_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', numId)
      .select('id, nome')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Se quantidade foi enviada, atualizar estoque e registrar movimentação
    if (quantidade !== undefined && quantidade !== null) {
      const novaQtd = Number(quantidade);
      const { data: est } = await supabase.from('estoque').select('quantidade').eq('vinho_id', numId).single();
      const qtdAnterior = est?.quantidade ?? 0;

      if (novaQtd !== qtdAnterior) {
        await supabase.from('estoque').update({ quantidade: novaQtd, updated_at: new Date().toISOString() }).eq('vinho_id', numId);
        await supabase.from('movimentacoes_estoque').insert({
          vinho_id: numId,
          tipo: 'ajuste',
          quantidade: Math.abs(novaQtd - qtdAnterior),
          quantidade_anterior: qtdAnterior,
          quantidade_nova: novaQtd,
          motivo: `Ajuste manual via edição: ${qtdAnterior} → ${novaQtd}`,
        });
      }
    }

    return NextResponse.json({ vinho: data, message: 'Vinho atualizado com sucesso.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// DELETE /api/vinhos/[id] — remove vinho, preserva histórico
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const numId = Number(id);

    // Buscar nome e quantidade atual antes de deletar
    const { data: vinho } = await supabase.from('vinhos').select('nome').eq('id', numId).single();
    const { data: est } = await supabase.from('estoque').select('quantidade').eq('vinho_id', numId).single();
    const nomeVinho = vinho?.nome ?? `Vinho #${id}`;
    const qtdAtual = est?.quantidade ?? 0;

    // Atualizar motivo nas movimentações existentes para preservar o nome do produto
    await supabase
      .from('movimentacoes_estoque')
      .update({ vinho_id: null, motivo: `[${nomeVinho}] ` })
      .eq('vinho_id', numId)
      .is('motivo', null);
    await supabase
      .from('movimentacoes_estoque')
      .update({ vinho_id: null })
      .eq('vinho_id', numId);

    // Registrar movimentação de remoção
    await supabase.from('movimentacoes_estoque').insert({
      vinho_id: null,
      tipo: 'saida',
      quantidade: qtdAtual,
      quantidade_anterior: qtdAtual,
      quantidade_nova: 0,
      motivo: `Produto removido do sistema: ${nomeVinho}`,
    });

    // Nullificar FKs em itens_venda
    await supabase.from('itens_venda').update({ vinho_id: null }).eq('vinho_id', numId);

    // Deletar registro de estoque e o produto
    await supabase.from('estoque').delete().eq('vinho_id', numId);
    const { error } = await supabase.from('vinhos').delete().eq('id', numId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Vinho removido.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
