import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    // Movimentações de vinhos
    const { data: movsVinho, error: errV } = await supabase
      .from('movimentacoes_estoque')
      .select(`
        id, tipo, quantidade, quantidade_anterior, quantidade_nova,
        motivo, created_at,
        vinhos(id, nome)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (errV) return NextResponse.json({ error: errV.message }, { status: 500 });

    // Movimentações de café
    const { data: movsCafe, error: errC } = await supabase
      .from('movimentacoes_estoque_cafe')
      .select(`
        id, tipo, quantidade, quantidade_anterior, quantidade_nova,
        motivo, created_at,
        cafes(id, nome)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (errC) return NextResponse.json({ error: errC.message }, { status: 500 });

    // Unificar e ordenar por data
    type MovItem = {
      id: number; tipo: string; quantidade: number;
      quantidade_anterior?: number; quantidade_nova?: number;
      motivo?: string; created_at: string;
      produto_tipo: 'vinho' | 'cafe';
      vinhos?: { id: number; nome: string };
      cafes?: { id: number; nome: string };
    };

    const vinhoNormalized = (movsVinho ?? []).map((m) => {
      const raw = m as Record<string, unknown>;
      const vinhoJoin = Array.isArray(raw.vinhos) ? raw.vinhos[0] : raw.vinhos;
      return { ...m, vinhos: vinhoJoin as { id: number; nome: string } | undefined, produto_tipo: 'vinho' as const };
    }) as MovItem[];

    const cafeNormalized = (movsCafe ?? []).map((m) => {
      const raw = m as Record<string, unknown>;
      const cafeJoin = Array.isArray(raw.cafes) ? raw.cafes[0] : raw.cafes;
      return { ...m, cafes: cafeJoin as { id: number; nome: string } | undefined, produto_tipo: 'cafe' as const };
    }) as MovItem[];

    const all = [...vinhoNormalized, ...cafeNormalized]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 50);

    return NextResponse.json({ movimentacoes: all });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
