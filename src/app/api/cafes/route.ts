import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/cafes — lista todos os cafés
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select(`
        id, nome, tipo_grao, torra, origem, peso_g,
        preco_custo, preco_venda, descricao, notas_degustacao,
        estoque_cafe(quantidade, localizacao)
      `)
      .order('nome', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cafes: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// POST /api/cafes — cria novo café
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      nome, tipo_grao, torra, origem, peso_g,
      preco_custo, preco_venda, descricao, notas_degustacao,
      estoque_inicial = 0,
      localizacao,
    } = body;

    if (!nome || !preco_venda) {
      return NextResponse.json({ error: 'Nome e preço de venda são obrigatórios.' }, { status: 400 });
    }

    // Inserir café
    const { data: cafe, error: errCafe } = await supabase
      .from('cafes')
      .insert({
        nome,
        tipo_grao: tipo_grao || null,
        torra: torra || null,
        origem: origem || null,
        peso_g: peso_g || 250,
        preco_custo: preco_custo || null,
        preco_venda,
        descricao: descricao || null,
        notas_degustacao: notas_degustacao || null,
      })
      .select('id, nome')
      .single();

    if (errCafe) return NextResponse.json({ error: errCafe.message }, { status: 500 });

    // Criar registro de estoque
    const { error: errEstoque } = await supabase
      .from('estoque_cafe')
      .insert({
        cafe_id: cafe.id,
        quantidade: estoque_inicial,
        localizacao: localizacao || null,
      });

    if (errEstoque) return NextResponse.json({ error: errEstoque.message }, { status: 500 });

    // Registrar movimentação se tiver estoque inicial
    if (estoque_inicial > 0) {
      await supabase.from('movimentacoes_estoque_cafe').insert({
        cafe_id: cafe.id,
        tipo: 'entrada',
        quantidade: estoque_inicial,
        quantidade_anterior: 0,
        quantidade_nova: estoque_inicial,
        motivo: 'Estoque inicial — cadastro do café',
      });
    }

    return NextResponse.json({ cafe, message: 'Café cadastrado com sucesso.' }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
