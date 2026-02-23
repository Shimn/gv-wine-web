# 🍷 GV Wine Web

Sistema de gestão de estoque de vinhos com chat IA — versão web do bot Telegram/WhatsApp.

**Stack:** Next.js 15 · TypeScript · Tailwind CSS · Supabase · Groq (Llama 3.3 70B) · Vercel

---

## ⚡ Setup Local

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env.local
```

Edite `.env.local` com suas credenciais:
```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon_aqui
GROQ_API_KEY=gsk_sua_chave_aqui
```

> ⚠️ Use as **mesmas credenciais** do bot Telegram/WhatsApp — compartilham o mesmo banco!

### 3. Rodar em desenvolvimento
```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

---

## 🚀 Deploy no Vercel via GitHub

### 1. Criar repositório GitHub
```bash
cd gv-wine-web
git init
git add .
git commit -m "feat: initial Next.js web app"
git remote add origin https://github.com/seu-usuario/gv-wine-web.git
git push -u origin main
```

### 2. Importar no Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em **"Add New… → Project"**
3. Selecione o repositório `gv-wine-web`
4. Vercel detecta Next.js automaticamente — não mude nada no build settings
5. Em **"Environment Variables"**, adicione:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `GROQ_API_KEY`
6. Clique em **"Deploy"** ✅

A cada `git push`, o Vercel faz deploy automático.

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── layout.tsx              # Layout raiz (sidebar + mobile nav)
│   ├── page.tsx                # Chat com IA (página principal)
│   ├── estoque/page.tsx        # Grid de vinhos em estoque
│   ├── vendas/page.tsx         # Lista de vendas
│   ├── movimentacoes/page.tsx  # Histórico de movimentações
│   └── api/
│       ├── chat/route.ts       # POST /api/chat
│       ├── estoque/route.ts    # GET /api/estoque
│       ├── vendas/route.ts     # GET /api/vendas
│       └── movimentacoes/route.ts
└── lib/
    ├── agent.ts                # Lógica de IA (porta do agentService.ts)
    ├── ai.ts                   # Cliente Groq
    ├── supabase.ts             # Cliente Supabase
    └── types.ts                # Tipos TypeScript
```

---

## 💬 Funcionalidades do Chat

| Comando natural | Ação |
|-----------------|------|
| "Quantos vinhos tem no estoque?" | Lista completa do estoque |
| "Me fala sobre o Malbec" | Detalhes do vinho |
| "Adiciona um Merlot, Tinto, R$ 80, 15 unidades" | Cadastra vinho novo |
| "Retira 5 unidades do Cabernet" | Baixa no estoque |
| "Adicione 10 unidades ao vinho 3" | Ajusta estoque existente |
| "Como estão as vendas?" | Resumo de vendas |

---

## 🔑 Onde obter as chaves

| Serviço | Link |
|---------|------|
| Supabase | [supabase.com](https://supabase.com) → Project Settings → API |
| Groq (gratuito) | [console.groq.com](https://console.groq.com) → API Keys |
