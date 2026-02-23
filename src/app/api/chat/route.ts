import { NextRequest, NextResponse } from 'next/server';
import { processUserMessage } from '@/lib/agent';

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json();

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json({ error: 'Mensagem inválida.' }, { status: 400 });
    }

    const response = await processUserMessage(message.trim());
    return NextResponse.json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Erro interno. Tente novamente.' }, { status: 500 });
  }
}
