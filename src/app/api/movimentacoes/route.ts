import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('movimentacoes_estoque')
      .select(`
        id, tipo, quantidade, quantidade_anterior, quantidade_nova,
        motivo, created_at,
        vinhos(id, nome)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ movimentacoes: data ?? [] });
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
