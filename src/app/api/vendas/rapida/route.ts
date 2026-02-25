import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/vendas/rapida — registra uma venda rápida de 1 vinho
export async function POST(req: NextRequest) {
  try {
    const {
      vinho_id,
      quantidade,
      preco_unitario,
      forma_pagamento = 'dinheiro',
      cliente_nome,
      desconto = 0,
      observacoes,
    } = await req.json();

    if (!vinho_id || !quantidade || !preco_unitario) {
      return NextResponse.json({ error: 'vinho_id, quantidade e preco_unitario são obrigatórios.' }, { status: 400 });
    }

    // Verificar estoque disponível
    const { data: estoqueAtual, error: errEst } = await supabase
      .from('estoque')
      .select('id, quantidade')
      .eq('vinho_id', vinho_id)
      .maybeSingle();

    if (errEst) return NextResponse.json({ error: errEst.message }, { status: 500 });

    const qtdDisponivel = estoqueAtual?.quantidade ?? 0;
    if (qtdDisponivel < quantidade) {
      return NextResponse.json({
        error: `Estoque insuficiente. Disponível: ${qtdDisponivel} unidade(s).`,
      }, { status: 400 });
    }

    // Buscar ou criar cliente
    let cliente_id: number | null = null;
    if (cliente_nome?.trim()) {
      const { data: clienteExistente } = await supabase
        .from('clientes')
        .select('id')
        .ilike('nome', cliente_nome.trim())
        .maybeSingle();

      if (clienteExistente) {
        cliente_id = clienteExistente.id;
      } else {
        const { data: novoCliente } = await supabase
          .from('clientes')
          .insert({ nome: cliente_nome.trim() })
          .select('id')
          .single();
        cliente_id = novoCliente?.id ?? null;
      }
    }

    const valor_total = quantidade * preco_unitario;
    const valor_final = Math.max(0, valor_total - desconto);

    // Criar venda
    const { data: venda, error: errVenda } = await supabase
      .from('vendas')
      .insert({
        cliente_id,
        data_venda: new Date().toISOString(),
        valor_total,
        desconto,
        valor_final,
        forma_pagamento,
        status: 'concluida',
        observacoes: observacoes || null,
      })
      .select('id')
      .single();

    if (errVenda) return NextResponse.json({ error: errVenda.message }, { status: 500 });

    // Criar item da venda
    const { error: errItem } = await supabase.from('itens_venda').insert({
      venda_id: venda.id,
      vinho_id,
      quantidade,
      preco_unitario,
      subtotal: quantidade * preco_unitario,
    });

    if (errItem) return NextResponse.json({ error: errItem.message }, { status: 500 });

    // Atualizar estoque
    const qtdNova = qtdDisponivel - quantidade;
    await supabase.from('estoque').update({ quantidade: qtdNova }).eq('vinho_id', vinho_id);

    // Registrar movimentação
    await supabase.from('movimentacoes_estoque').insert({
      vinho_id,
      tipo: 'saida',
      quantidade,
      quantidade_anterior: qtdDisponivel,
      quantidade_nova: qtdNova,
      motivo: `Venda #${venda.id}`,
      venda_id: venda.id,
    });

    return NextResponse.json({
      message: 'Venda registrada com sucesso.',
      venda_id: venda.id,
      estoque_restante: qtdNova,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
