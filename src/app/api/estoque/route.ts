import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('vinhos')
      .select(`
        id, nome, safra, tipo_uva, teor_alcoolico, volume_ml,
        preco_custo, preco_venda, descricao, notas_degustacao,
        produtores(nome),
        categorias(nome),
        estoque(quantidade, localizacao)
      `)
      .order('nome', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ vinhos: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
