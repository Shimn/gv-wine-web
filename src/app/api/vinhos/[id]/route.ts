import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Params { params: Promise<{ id: string }> }

// PUT /api/vinhos/[id] — atualiza informações do vinho
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      nome, safra, tipo_uva, teor_alcoolico, volume_ml,
      preco_custo, preco_venda, descricao, notas_degustacao,
      produtor_id, categoria_id,
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
      .eq('id', id)
      .select('id, nome')
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ vinho: data, message: 'Vinho atualizado com sucesso.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// DELETE /api/vinhos/[id] — remove vinho
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const { error } = await supabase.from('vinhos').delete().eq('id', id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Vinho removido.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
