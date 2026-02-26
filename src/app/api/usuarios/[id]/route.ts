import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface Params { params: Promise<{ id: string }> }

// PUT /api/usuarios/[id] — atualiza perfil
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { nome, role, ativo } = body;

    const update: Record<string, unknown> = {};
    if (nome !== undefined)  update.nome  = nome;
    if (role !== undefined)  update.role  = role;
    if (ativo !== undefined) update.ativo = ativo;

    const { error } = await supabase
      .from('perfis')
      .update(update)
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Perfil atualizado.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}

// DELETE /api/usuarios/[id] — desativa o usuário
export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;

    // Desativa o perfil (não remove do auth para manter histórico)
    const { error } = await supabase
      .from('perfis')
      .update({ ativo: false })
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Usuário desativado.' });
  } catch {
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
  }
}
