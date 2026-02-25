import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/estoque-cafe — lista cafés com estoque
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('cafes')
      .select(`
        id, nome, tipo_grao, torra, formato, origem, peso_g,
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
