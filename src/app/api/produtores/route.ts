import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('produtores')
      .select('id, nome')
      .order('nome');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ produtores: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
