'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { ChatMessage } from '@/lib/types';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import SuggestionChips from '@/components/SuggestionChips';

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: `👋 Olá! Sou o **Gerente de Estoque** da GV Wine.

Posso te ajudar com:
- 📦 Consultar e gerenciar o estoque de vinhos
- 🍷 Buscar detalhes de um vinho específico
- ➕ Adicionar ou ajustar quantidades
- 💰 Verificar vendas e faturamento

Use os atalhos abaixo ou escreva livremente!`,
  timestamp: new Date(),
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const inputRef                = useRef<HTMLTextAreaElement>(null);

  // Auto scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id:        Date.now().toString(),
      role:      'user',
      content:   trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res  = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ message: trimmed }),
      });
      const data = await res.json();

      const botMsg: ChatMessage = {
        id:        (Date.now() + 1).toString(),
        role:      'assistant',
        content:   data.response ?? data.error ?? '❌ Sem resposta.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: '❌ Erro de conexão. Tente novamente.', timestamp: new Date() },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [loading]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const showSuggestions = messages.length <= 1;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-wine-700 flex items-center justify-center">
          <span className="text-lg">🍷</span>
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">Gerente de Estoque</p>
          <p className="text-xs text-green-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            Online · IA ativa
          </p>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips */}
      {showSuggestions && (
        <div className="shrink-0 border-t border-gray-100 bg-white">
          <SuggestionChips onSelect={sendMessage} disabled={loading} />
        </div>
      )}

      {/* Input */}
      <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-3">
        <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl px-4 py-2 focus-within:border-wine-400 transition-colors">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua mensagem... (Enter para enviar)"
            disabled={loading}
            className="flex-1 resize-none bg-transparent text-sm text-gray-800 placeholder-gray-400
                       focus:outline-none max-h-32 min-h-[1.5rem] disabled:opacity-50"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            aria-label="Enviar"
            className="w-8 h-8 rounded-full bg-wine-700 text-white flex items-center justify-center
                       hover:bg-wine-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <svg className="w-4 h-4 rotate-90" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-1.5">
          <span className="hidden sm:inline">Shift+Enter para nova linha · </span>Powered by Groq Llama 3.3 70B
        </p>
      </div>
    </div>
  );
}
