import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/vinhos — lista todos os vinhos
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('vinhos')
      .select(`
        id, nome, safra, tipo_uva, teor_alcoolico, volume_ml,
        preco_custo, preco_venda, descricao, notas_degustacao,
        produtor_id, categoria_id,
        produtores(id, nome),
        categorias(id, nome),
        estoque(quantidade, localizacao)
      `)
      .order('nome', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ vinhos: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// POST /api/vinhos — cria novo vinho
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nome, safra, tipo_uva, teor_alcoolico, volume_ml,
      preco_custo, preco_venda, descricao, notas_degustacao,
      produtor_id, categoria_id,
      estoque_inicial = 0,
      localizacao,
    } = body;

    if (!nome || !preco_venda) {
      return NextResponse.json({ error: 'Nome e preço de venda são obrigatórios.' }, { status: 400 });
    }

    // Inserir vinho
    const { data: vinho, error: errVinho } = await supabase
      .from('vinhos')
      .insert({
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
      })
      .select('id, nome')
      .single();

    if (errVinho) return NextResponse.json({ error: errVinho.message }, { status: 500 });

    // Criar registro de estoque
    const { error: errEstoque } = await supabase
      .from('estoque')
      .insert({
        vinho_id: vinho.id,
        quantidade: estoque_inicial,
        localizacao: localizacao || null,
      });

    if (errEstoque) return NextResponse.json({ error: errEstoque.message }, { status: 500 });

    // Registrar movimentação se tiver estoque inicial
    if (estoque_inicial > 0) {
      await supabase.from('movimentacoes_estoque').insert({
        vinho_id: vinho.id,
        tipo: 'entrada',
        quantidade: estoque_inicial,
        quantidade_anterior: 0,
        quantidade_nova: estoque_inicial,
        motivo: 'Estoque inicial — cadastro do vinho',
      });
    }

    return NextResponse.json({ vinho, message: 'Vinho cadastrado com sucesso.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
