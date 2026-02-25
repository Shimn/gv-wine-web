import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Params { params: Promise<{ id: string }> }

// PUT /api/cafes/[id] — atualiza informações do café
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      nome, tipo_grao, torra, origem, peso_g,
      preco_custo, preco_venda, descricao, notas_degustacao,
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
        origem: origem || null,
        peso_g: peso_g || 250,
        preco_custo: preco_custo || null,
        preco_venda,
        descricao: descricao || null,
        notas_degustacao: notas_degustacao || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('id, nome')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ cafe: data, message: 'Café atualizado com sucesso.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// DELETE /api/cafes/[id] — remove café
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('cafes').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Café removido.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
