import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/auth/register — cadastro público (ativo = false, precisa aprovação)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, nome } = body;

    if (!email || !password || !nome) {
      return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
    }

    // Verificar se e-mail já está cadastrado na tabela perfis
    const { data: existing } = await supabase
      .from('perfis')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 });
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authErr) {
      if (authErr.message.includes('already been registered')) {
        return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 });
      }
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Falha ao criar usuário.' }, { status: 500 });
    }

    // Criar perfil com ativo = false (pendente de aprovação)
    const { error: perfilErr } = await supabase
      .from('perfis')
      .insert({
        id: authData.user.id,
        email,
        nome,
        role: 'vendedor',
        ativo: false,
      });

    if (perfilErr) {
      return NextResponse.json({ error: perfilErr.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Cadastro realizado! Aguarde a aprovação de um administrador.',
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
