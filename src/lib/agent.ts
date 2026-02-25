import { supabase } from './supabase';
import { chat } from './ai';

// ============================================
// Agent – mesma lógica do agentService.ts do bot
// Adaptado para Next.js API routes (server-side)
// ============================================

// Local types for agent queries
type VinhoQuery = {
  id: number;
  nome: string;
  safra?: number;
  tipo_uva?: string;
  teor_alcoolico?: number;
  preco_venda?: number;
  descricao?: string;
  notas_degustacao?: string;
  produtores?: { nome?: string } | null;
  categorias?: { nome?: string } | null;
  estoque?: { quantidade: number; localizacao?: string }[];
};

type CategoriaRow = { id: number; nome: string };
type ProdutorRow = { id: number; nome: string };
type VinhoInsert = { nome: string; categoria_id: number; preco_venda: number; produtor_id?: number; safra?: number };

type ActionType =
  | 'estoque'
  | 'vinho_detalhes'
  | 'adicionar_vinho'
  | 'retirar_vinho'
  | 'ajustar_estoque'
  | 'ajuda'
  | 'vendas'
  | 'conversa';

interface AgentAction {
  action: ActionType;
  params?: Record<string, string>;
}

const WEB_USER_ID = 1; // ID fixo para usuário web (sem autenticação por ora)

// -------------------------------------------------
export async function processUserMessage(message: string): Promise<string> {
  const actionPrompt = `
Você é o gerente de estoque de uma loja de vinhos. Analise a mensagem e identifique a AÇÃO:

AÇÕES DISPONÍVEIS:
- "estoque": consultar estoque, lista de vinhos
- "vinho_detalhes": informações de um vinho específico (extraia nome ou ID)
- "adicionar_vinho": cadastrar vinho novo (extraia: nome, produtor, categoria, safra, preco, quantidade)
- "retirar_vinho": remover/vender unidades (extraia: vinho, quantidade)
- "ajustar_estoque": adicionar unidades a vinho existente (extraia: vinho, quantidade)
- "ajuda": o que o sistema pode fazer
- "vendas": consultar vendas/faturamento
- "conversa": cumprimentos e conversas gerais

Mensagem: "${message}"

Responda APENAS com JSON:
{"action": "nome_da_acao", "params": {"campo": "valor"}}
`;

  try {
    const actionResponse = await chat(actionPrompt);
    if (!actionResponse) return 'Desculpe, não consegui processar sua mensagem.';

    let action: AgentAction;
    try {
      const jsonStr = actionResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      action = JSON.parse(jsonStr);
    } catch {
      action = { action: 'conversa' };
    }

    return executeAction(action, message);
  } catch (error) {
    console.error('Agent error:', error);
    return 'Desculpe, ocorreu um erro ao processar sua solicitação.';
  }
}

// -------------------------------------------------
async function executeAction(action: AgentAction, original: string): Promise<string> {
  switch (action.action) {
    case 'estoque':       return handleEstoque(original);
    case 'vinho_detalhes': return handleVinhoDetalhes(action.params?.busca ?? '', original);
    case 'adicionar_vinho': return handleAdicionarVinho(action.params ?? {});
    case 'retirar_vinho': return handleRetirarVinho(action.params ?? {});
    case 'ajustar_estoque': return handleAjustarEstoque(action.params ?? {});
    case 'ajuda':         return handleAjuda();
    case 'vendas':        return handleVendas(original);
    case 'conversa':
    default:              return handleConversa(original);
  }
}

// -------------------------------------------------
async function handleEstoque(userMessage: string): Promise<string> {
  const { data: estoque, error } = await supabase
    .from('vinhos')
    .select('id, nome, safra, preco_venda, produtores(nome), categorias(nome), estoque(quantidade)')
    .order('nome', { ascending: true });

  if (error || !estoque) return '❌ Não consegui acessar o estoque no momento.';
  if (estoque.length === 0) return '📦 O estoque está vazio no momento.';

  let estoqueInfo = 'DADOS DO ESTOQUE:\n\n';
  let totalVinhos = 0;
  let totalUnidades = 0;

  type EstoqueRow = { id: number; nome: string; safra?: number; preco_venda?: number; produtores?: { nome?: string } | null; categorias?: { nome?: string } | null; estoque?: { quantidade: number }[] };
  (estoque as EstoqueRow[]).forEach((v) => {
    const qtd = v.estoque?.[0]?.quantidade ?? 0;
    totalUnidades += qtd;
    if (qtd > 0) totalVinhos++;
    const produtor  = v.produtores?.nome ?? 'N/A';
    const categoria = v.categorias?.nome ?? 'N/A';
    estoqueInfo += `- ID ${v.id}: ${v.nome} (${produtor}, ${categoria}, Safra ${v.safra ?? 'N/A'}): ${qtd} un., R$ ${v.preco_venda?.toFixed(2)}\n`;
  });

  estoqueInfo += `\nTOTAL: ${totalVinhos} vinhos diferentes, ${totalUnidades} unidades`;

  const prompt = `Você é o gerente de estoque. Pergunta: "${userMessage}"\n\n${estoqueInfo}\n\nResponda de forma objetiva e direta.`;
  const response = await chat(prompt);
  return response ?? estoqueInfo;
}

// -------------------------------------------------
async function handleVinhoDetalhes(busca: string, userMessage: string): Promise<string> {
  if (!busca) return '🔍 Especifique qual vinho você quer consultar.';

  const isId = !isNaN(Number(busca));
  let query = supabase
    .from('vinhos')
    .select('id, nome, safra, tipo_uva, teor_alcoolico, preco_venda, descricao, notas_degustacao, produtores(nome), categorias(nome), estoque(quantidade, localizacao)');

  query = isId ? query.eq('id', parseInt(busca)) : query.ilike('nome', `%${busca}%`);

  const { data: vinhos, error } = await query;

  if (error || !vinhos || vinhos.length === 0) return `🍷 Não encontrei nenhum vinho com "${busca}".`;

  if (vinhos.length > 1) {
    let lista = `🔍 Encontrei ${vinhos.length} vinhos:\n\n`;
    (vinhos as VinhoQuery[]).forEach((v) => {
      const qtd = v.estoque?.[0]?.quantidade ?? 0;
      lista += `- ID ${v.id}: ${v.nome} (${qtd} unidades)\n`;
    });
    return lista + '\n💡 Seja mais específico ou use o ID do vinho.';
  }

  const v = vinhos[0] as VinhoQuery;
  const qtd      = v.estoque?.[0]?.quantidade ?? 0;
  const produtor  = v.produtores?.nome ?? 'N/A';
  const categoria = v.categorias?.nome ?? 'N/A';

  const info = `VINHO: ${v.nome}\nProdutor: ${produtor}\nCategoria: ${categoria}\nSafra: ${v.safra ?? 'N/A'}\nUva: ${v.tipo_uva ?? 'N/A'}\nTeor: ${v.teor_alcoolico ? v.teor_alcoolico + '%' : 'N/A'}\nPreço: R$ ${v.preco_venda?.toFixed(2)}\nEstoque: ${qtd} unidades${v.descricao ? '\nDescrição: ' + v.descricao : ''}${v.notas_degustacao ? '\nNotas: ' + v.notas_degustacao : ''}`;

  const response = await chat(`Pergunta: "${userMessage}"\n\n${info}\n\nResponda de forma objetiva.`);
  return response ?? info;
}

// -------------------------------------------------
async function handleAdicionarVinho(params: Record<string, string>): Promise<string> {
  const { nome, produtor: produtorNome, categoria: categoriaNome, safra, preco, quantidade } = params;

  if (!nome || !categoriaNome || !preco || !quantidade) {
    return '❌ Preciso de: nome, categoria, preço e quantidade.\n\nExemplo: "Adiciona um Malbec, Tinto, R$ 89, 10 unidades"';
  }

  // Categoria
  let categoria: CategoriaRow | null = null;
  const { data: catExist } = await supabase.from('categorias').select('*').eq('nome', categoriaNome).single();
  if (catExist) {
    categoria = catExist as CategoriaRow;
  } else {
    const { data: newCat, error } = await supabase.from('categorias').insert([{ nome: categoriaNome }]).select().single();
    if (error) return `❌ Erro ao criar categoria: ${error.message}`;
    categoria = newCat as CategoriaRow;
  }

  // Produtor (opcional)
  let produtor: ProdutorRow | null = null;
  if (produtorNome) {
    const { data: prodExist } = await supabase.from('produtores').select('*').eq('nome', produtorNome).single();
    if (prodExist) {
      produtor = prodExist as ProdutorRow;
    } else {
      const { data: newProd, error } = await supabase.from('produtores').insert([{ nome: produtorNome }]).select().single();
      if (error) return `❌ Erro ao criar produtor: ${error.message}`;
      produtor = newProd as ProdutorRow;
    }
  }

  // Vinho
  const vinhoData: VinhoInsert = { nome, categoria_id: categoria!.id, preco_venda: parseFloat(preco) };
  if (produtor) vinhoData.produtor_id = produtor.id;
  if (safra)    vinhoData.safra = parseInt(safra);

  const { data: vinho, error: vinhoErr } = await supabase.from('vinhos').insert([vinhoData]).select().single();
  if (vinhoErr) return `❌ Erro ao criar vinho: ${vinhoErr.message}`;

  const { error: estoqueErr } = await supabase.from('estoque').insert([{ vinho_id: vinho.id, quantidade: parseInt(quantidade) }]);
  if (estoqueErr) return `❌ Erro ao adicionar ao estoque: ${estoqueErr.message}`;

  await supabase.from('movimentacoes_estoque').insert([{ vinho_id: vinho.id, tipo: 'entrada', quantidade: parseInt(quantidade), motivo: 'Adição via Web', usuario_id: WEB_USER_ID }]);

  return `✅ Vinho adicionado com sucesso!\n\n🍷 **${nome}**\n${produtorNome ? '🏭 ' + produtorNome + '\n' : ''}📁 ${categoriaNome}\n${safra ? '📅 Safra: ' + safra + '\n' : ''}💰 R$ ${parseFloat(preco).toFixed(2)}\n📦 ${quantidade} unidades\n🆔 ID: ${vinho.id}`;
}

// -------------------------------------------------
async function handleRetirarVinho(params: Record<string, string>): Promise<string> {
  const { vinho: vinhoNome, quantidade } = params;

  if (!vinhoNome || !quantidade) {
    return '❌ Preciso saber qual vinho e a quantidade.\n\nExemplo: "Retira 5 unidades do Malbec"';
  }

  const qtdRetirar = parseInt(quantidade);
  if (isNaN(qtdRetirar) || qtdRetirar <= 0) return '❌ A quantidade deve ser um número positivo.';

  const vinhos = await buscarVinho(vinhoNome);
  if (!vinhos) return `❌ Não encontrei o vinho "${vinhoNome}".`;
  if (vinhos.length > 1) return formatarListaVinhos(vinhos, 'Encontrei múltiplos vinhos. Use o ID específico.');

  const v = vinhos[0];
  const estoqueAtual = v.estoque?.[0]?.quantidade ?? 0;

  if (estoqueAtual < qtdRetirar) {
    return `❌ Estoque insuficiente!\n🍷 ${v.nome}\n📦 Disponível: ${estoqueAtual}\n❌ Solicitado: ${qtdRetirar}`;
  }

  const novaQtd = estoqueAtual - qtdRetirar;
  const { error } = await supabase.from('estoque').update({ quantidade: novaQtd }).eq('vinho_id', v.id);
  if (error) return `❌ Erro ao atualizar estoque: ${error.message}`;

  await supabase.from('movimentacoes_estoque').insert([{ vinho_id: v.id, tipo: 'saida', quantidade: qtdRetirar, motivo: 'Retirada via Web', usuario_id: WEB_USER_ID }]);

  const valorTotal = v.preco_venda ? (v.preco_venda * qtdRetirar).toFixed(2) : 'N/A';
  const alerta = novaQtd === 0 ? '⚠️ ATENÇÃO: Estoque zerado!' : novaQtd < 5 ? '⚠️ Estoque baixo!' : '✅ Estoque OK';
  return `✅ Retirada realizada!\n🍷 **${v.nome}**\n📤 Retirado: ${qtdRetirar} un.\n📦 Estoque: ${estoqueAtual} → ${novaQtd}\n💰 Valor total: R$ ${valorTotal}\n${alerta}`;
}

// -------------------------------------------------
async function handleAjustarEstoque(params: Record<string, string>): Promise<string> {
  const { vinho: vinhoNome, quantidade } = params;

  if (!vinhoNome || !quantidade) {
    return '❌ Preciso saber qual vinho e a quantidade.\n\nExemplo: "Adicione 5 unidades ao Malbec"';
  }

  const qtdAdicionar = parseInt(quantidade);
  if (isNaN(qtdAdicionar) || qtdAdicionar === 0) return '❌ A quantidade deve ser diferente de zero.';

  const vinhos = await buscarVinho(vinhoNome);
  if (!vinhos) return `❌ Não encontrei o vinho "${vinhoNome}".`;
  if (vinhos.length > 1) return formatarListaVinhos(vinhos, 'Encontrei múltiplos vinhos. Use o ID específico.');

  const v = vinhos[0];
  const estoqueAtual = v.estoque?.[0]?.quantidade ?? 0;
  const novaQtd = estoqueAtual + qtdAdicionar;

  if (novaQtd < 0) return `❌ O estoque não pode ficar negativo.\n📦 Atual: ${estoqueAtual} | Ajuste: ${qtdAdicionar}`;

  const { error } = await supabase.from('estoque').update({ quantidade: novaQtd }).eq('vinho_id', v.id);
  if (error) return `❌ Erro ao atualizar estoque: ${error.message}`;

  await supabase.from('movimentacoes_estoque').insert([{ vinho_id: v.id, tipo: qtdAdicionar > 0 ? 'entrada' : 'saida', quantidade: Math.abs(qtdAdicionar), motivo: 'Ajuste via Web', usuario_id: WEB_USER_ID }]);

  const op = qtdAdicionar > 0 ? '📥 Adicionado' : '📤 Removido';
  const alerta = novaQtd === 0 ? '⚠️ ATENÇÃO: Estoque zerado!' : novaQtd < 5 ? '⚠️ Estoque baixo!' : '✅ Estoque OK';
  return `✅ Estoque ajustado!\n🍷 **${v.nome}**\n${op}: ${Math.abs(qtdAdicionar)} un.\n📦 Estoque: ${estoqueAtual} → ${novaQtd}\n${alerta}`;
}

// -------------------------------------------------
async function handleVendas(userMessage: string): Promise<string> {
  const { data: vendas, error } = await supabase
    .from('vendas')
    .select('valor_final, data_venda')
    .order('data_venda', { ascending: false })
    .limit(10);

  if (error || !vendas || vendas.length === 0) return '📊 Não há vendas registradas ainda.';

  const total = vendas.reduce((s, v) => s + (v.valor_final ?? 0), 0);
  const response = await chat(`Pergunta: "${userMessage}"\n\nVendas recentes: ${vendas.length}\nValor total: R$ ${total.toFixed(2)}\n\nResponda de forma objetiva.`);
  return response ?? `📊 ${vendas.length} vendas registradas. Total: R$ ${total.toFixed(2)}`;
}

// -------------------------------------------------
function handleAjuda(): Promise<string> {
  return Promise.resolve(`🤖 **Sou o gerente de estoque da loja de vinhos!**

Aqui está o que posso fazer:

📦 **CONSULTAS DE ESTOQUE**
• "Quantos vinhos tem no estoque?"
• "Lista o estoque completo"

🍷 **INFORMAÇÕES DE VINHOS**
• "Me fala sobre o Malbec"
• "Qual o preço do vinho ID 5?"

➕ **ADICIONAR VINHOS NOVOS**
• "Adiciona um Merlot, Tinto, R$ 80, 15 unidades"

➖ **RETIRAR DO ESTOQUE**
• "Retira 5 unidades do Malbec"
• "Vendi 3 Cabernet"

📊 **AJUSTAR QUANTIDADES**
• "Adicione 10 unidades ao Nero d'Avola"

💰 **VENDAS**
• "Como estão as vendas?"
• "Qual o faturamento?"

💬 Use linguagem natural, eu entendo!`);
}

// -------------------------------------------------
async function handleConversa(message: string): Promise<string> {
  const response = await chat(message, 'Responda de forma objetiva e direta como gerente de estoque de vinhos.');
  return response ?? 'Não entendi. O que você precisa?';
}

// -------------------------------------------------
// Helpers
async function buscarVinho(busca: string): Promise<VinhoQuery[] | null> {
  const isId = !isNaN(Number(busca));
  let query = supabase
    .from('vinhos')
    .select('id, nome, safra, preco_venda, produtores(nome), categorias(nome), estoque(quantidade)');

  query = isId ? query.eq('id', parseInt(busca)) : query.ilike('nome', `%${busca}%`);

  const { data, error } = await query;
  if (error || !data || data.length === 0) return null;
  return data as VinhoQuery[];
}

function formatarListaVinhos(vinhos: VinhoQuery[], note: string): string {
  let lista = `🔍 ${note}\n\n`;
  vinhos.forEach((v) => {
    const qtd = v.estoque?.[0]?.quantidade ?? 0;
    lista += `- ID ${v.id}: ${v.nome} (${qtd} un.)\n`;
  });
  return lista;
}
