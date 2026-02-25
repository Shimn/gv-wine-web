'use client';

import { useState } from 'react';

// ────────────────────────────────────────────────────────────────────────────
// Dados das seções de ajuda
// ────────────────────────────────────────────────────────────────────────────
interface Step {
  text: string;
  detail?: string;
}

interface HelpSection {
  id: string;
  icon: string;
  title: string;
  description: string;
  steps: Step[];
}

const SECTIONS: HelpSection[] = [
  {
    id: 'consultar-estoque',
    icon: '📦',
    title: 'Consultar estoque',
    description: 'Veja todos os vinhos cadastrados, quantidades disponíveis e filtros.',
    steps: [
      { text: 'Acesse a página "Estoque" pelo menu lateral ou barra inferior.' },
      { text: 'Veja os cards com nome, produtor, quantidade e status de cada vinho.' },
      { text: 'Use o campo de busca para filtrar por nome ou produtor.', detail: 'A busca funciona em tempo real, sem precisar apertar Enter.' },
      { text: 'Use o filtro de categoria ao lado da busca para exibir somente vinhos tintos, brancos, etc.' },
      { text: 'Os indicadores no topo mostram o total de tipos, unidades, vinhos zerados e com estoque baixo.' },
    ],
  },
  {
    id: 'cadastrar-vinho',
    icon: '➕',
    title: 'Cadastrar um novo vinho',
    description: 'Adicione um vinho ao catálogo com informações e estoque inicial.',
    steps: [
      { text: 'Na página "Estoque", toque no botão "+ Novo vinho" no canto superior direito.' },
      { text: 'O painel lateral abrirá na aba "Novo vinho".' },
      { text: 'Preencha os campos obrigatórios: Nome e Preço de venda.', detail: 'Os demais campos (safra, volume, produtor, categoria, etc.) são opcionais mas ajudam na organização.' },
      { text: 'Defina a quantidade de Estoque inicial.' },
      { text: 'Toque em "Cadastrar vinho" para salvar.' },
      { text: 'Uma mensagem de confirmação aparecerá e a lista será atualizada automaticamente.' },
    ],
  },
  {
    id: 'entrada-estoque',
    icon: '📥',
    title: 'Registrar entrada de estoque',
    description: 'Adicione unidades a um vinho já cadastrado (reposição, compra de fornecedor).',
    steps: [
      { text: 'Na página "Estoque", toque no card do vinho desejado.' },
      { text: 'O painel lateral abrirá com os detalhes do vinho.' },
      { text: 'Toque na aba "📦 Entrada".' },
      { text: 'Informe a quantidade a adicionar e, opcionalmente, o motivo (ex: "Compra fornecedor").' },
      { text: 'Toque em "Confirmar entrada".' },
      { text: 'O estoque será atualizado instantaneamente e a movimentação ficará registrada no histórico.' },
    ],
  },
  {
    id: 'venda-rapida',
    icon: '💰',
    title: 'Registrar uma venda rápida',
    description: 'Venda diretamente pelo painel do vinho — desconta do estoque automaticamente.',
    steps: [
      { text: 'Na página "Estoque", toque no card do vinho que deseja vender.' },
      { text: 'No painel lateral, toque na aba "💰 Venda".' },
      { text: 'Preencha: quantidade, preço unitário, forma de pagamento.', detail: 'O preço unitário já vem preenchido com o preço de venda cadastrado.' },
      { text: 'Opcionalmente, adicione o nome do cliente, desconto e observações.' },
      { text: 'Confira o resumo com subtotal, desconto e total.' },
      { text: 'Toque em "Registrar venda".', detail: 'O estoque será descontado automaticamente e a venda aparecerá na página de Vendas.' },
    ],
  },
  {
    id: 'editar-vinho',
    icon: '✏️',
    title: 'Editar informações de um vinho',
    description: 'Altere nome, preço, descrição ou qualquer informação do vinho.',
    steps: [
      { text: 'Na página "Estoque", toque no card do vinho.' },
      { text: 'No painel lateral, toque na aba "✏️ Editar".' },
      { text: 'Altere os campos desejados.' },
      { text: 'Toque em "Salvar alterações".' },
    ],
  },
  {
    id: 'ver-vendas',
    icon: '📊',
    title: 'Consultar vendas e faturamento',
    description: 'Acompanhe KPIs, gráficos e detalhes de cada venda.',
    steps: [
      { text: 'Acesse a página "Vendas" pelo menu.' },
      { text: 'No topo, escolha o período: 7 dias, 30 dias, 3 meses, 1 ano ou personalizado.' },
      { text: 'Os cards de KPI mostram faturamento, ticket médio, vendas concluídas e canceladas.' },
      { text: 'O gráfico de barras exibe o faturamento por dia.' },
      { text: 'Abaixo há os painéis de forma de pagamento e top vinhos por receita.' },
      { text: 'Na lista "Detalhes das vendas", toque em uma venda para expandir e ver os itens.', detail: 'Use os filtros de status (Todos, Concluída, Pendente, Cancelada) para refinar.' },
    ],
  },
  {
    id: 'historico',
    icon: '📋',
    title: 'Verificar histórico de movimentações',
    description: 'Veja todas as entradas, saídas, ajustes e perdas registradas.',
    steps: [
      { text: 'Acesse a página "Histórico" pelo menu.' },
      { text: 'Todas as movimentações aparecem em ordem cronológica (mais recentes primeiro).' },
      { text: 'Use os filtros (Todos, Entrada, Saída, Ajuste, Perda) para filtrar por tipo.' },
      { text: 'Cada item mostra o vinho, quantidade movimentada, motivo e data/hora.' },
    ],
  },
  {
    id: 'chat-ia',
    icon: '💬',
    title: 'Usar o Chat com IA',
    description: 'Converse com o gerente virtual para consultar e gerenciar o estoque via linguagem natural.',
    steps: [
      { text: 'Acesse a página "Chat" (página inicial).' },
      { text: 'Digite sua pergunta ou comando em linguagem natural.', detail: 'Exemplos: "Quantos vinhos tem no estoque?", "Adiciona 5 unidades ao Malbec", "Como estão as vendas?"' },
      { text: 'Use os atalhos sugeridos abaixo da mensagem de boas-vindas para ações rápidas.' },
      { text: 'A IA processará sua mensagem e executará a operação ou retornará as informações solicitadas.' },
      { text: 'Pressione Enter para enviar. Use Shift+Enter para pular linha.' },
    ],
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Componente
// ────────────────────────────────────────────────────────────────────────────
export default function AjudaPage() {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4 shrink-0">
        <h1 className="text-lg font-bold text-gray-900">❓ Como usar o sistema</h1>
        <p className="text-xs text-gray-500 mt-1">
          Toque em uma seção para ver as instruções passo a passo.
        </p>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {SECTIONS.map((section) => {
          const isOpen = openId === section.id;
          return (
            <div key={section.id} className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
              {/* Cabeçalho da seção */}
              <button
                onClick={() => toggle(section.id)}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
              >
                <span className="text-xl shrink-0">{section.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{section.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{section.description}</p>
                </div>
                <span className={`text-gray-300 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* Passos (expandível) */}
              {isOpen && (
                <div className="px-4 pb-4 pt-1 border-t border-gray-50">
                  <ol className="space-y-3">
                    {section.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="shrink-0 w-6 h-6 rounded-full bg-wine-100 text-wine-700 text-xs font-bold flex items-center justify-center mt-0.5">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{step.text}</p>
                          {step.detail && (
                            <p className="text-xs text-gray-400 mt-0.5 italic">{step.detail}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          );
        })}

        {/* Dica final */}
        <div className="bg-wine-50 border border-wine-100 rounded-xl px-4 py-3 mt-4">
          <p className="text-sm font-medium text-wine-800">💡 Dica</p>
          <p className="text-xs text-wine-600 mt-1">
            Você pode usar o <strong>Chat com IA</strong> para realizar qualquer operação por texto.
            Basta digitar o que precisa — por exemplo: {'"'}Adiciona 10 unidades do Cabernet{'"'} ou {'"'}Qual o vinho mais vendido?{'"'}
          </p>
        </div>
      </div>
    </div>
  );
}
