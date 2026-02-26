import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET /api/usuarios — lista todos os perfis
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('perfis')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ usuarios: data ?? [] });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// POST /api/usuarios — cria usuário (auth + perfil)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, nome, role = 'vendedor' } = body;

    if (!email || !password || !nome) {
      return NextResponse.json({ error: 'Email, senha e nome são obrigatórios.' }, { status: 400 });
    }

    // Criar usuário no Supabase Auth usando service role (server-side)
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr) return NextResponse.json({ error: authErr.message }, { status: 500 });
    if (!authData.user) return NextResponse.json({ error: 'Falha ao criar usuário.' }, { status: 500 });

    // Criar perfil na tabela `perfis`
    const { error: perfilErr } = await supabase
      .from('perfis')
      .insert({
        id: authData.user.id,
        email,
        nome,
        role,
        ativo: true,
      });

    if (perfilErr) return NextResponse.json({ error: perfilErr.message }, { status: 500 });

    return NextResponse.json({
      usuario: { id: authData.user.id, email, nome, role },
      message: 'Usuário criado com sucesso.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
