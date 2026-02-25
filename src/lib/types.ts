// ============================================
// TIPOS COMPARTILHADOS
// Espelha os tipos do sistema Telegram/WhatsApp
// ============================================

export interface User {
  id: number;
  telegram_id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  role?: 'admin' | 'vendedor' | 'cliente';
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: number;
  user_id: number;
  text: string;
  created_at?: string;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao?: string;
}

export interface Regiao {
  id: number;
  pais: string;
  regiao?: string;
}

export interface Produtor {
  id: number;
  nome: string;
  regiao_id?: number;
  contato?: string;
  regioes?: Regiao;
}

export interface Estoque {
  id: number;
  vinho_id: number;
  quantidade: number;
  localizacao?: string;
  lote?: string;
  data_entrada?: string;
  data_validade?: string;
}

export interface Vinho {
  id: number;
  nome: string;
  produtor_id?: number;
  categoria_id?: number;
  safra?: number;
  tipo_uva?: string;
  teor_alcoolico?: number;
  volume_ml?: number;
  preco_custo?: number;
  preco_venda: number;
  descricao?: string;
  notas_degustacao?: string;
  created_at?: string;
  updated_at?: string;
  // Joins
  produtores?: { id?: number; nome: string; contato?: string } | null;
  categorias?: { id?: number; nome: string } | null;
  estoque?: Estoque[];
}

export interface Cliente {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  cpf_cnpj?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacoes?: string;
}

export interface ItemVenda {
  id: number;
  venda_id: number;
  vinho_id?: number;
  cafe_id?: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  vinhos?: Pick<Vinho, 'id' | 'nome' | 'safra'>;
  cafes?: Pick<Cafe, 'id' | 'nome'>;
}

export interface Venda {
  id: number;
  cliente_id?: number;
  vendedor_id?: number;
  data_venda: string;
  valor_total: number;
  desconto: number;
  valor_final: number;
  forma_pagamento?: 'dinheiro' | 'pix' | 'credito' | 'debito' | 'boleto';
  status: 'pendente' | 'concluida' | 'cancelada';
  observacoes?: string;
  clientes?: Pick<Cliente, 'id' | 'nome'>;
  itens_venda?: ItemVenda[];
}

export interface MovimentacaoEstoque {
  id: number;
  vinho_id: number;
  tipo: 'entrada' | 'saida' | 'ajuste' | 'perda';
  quantidade: number;
  quantidade_anterior?: number;
  quantidade_nova?: number;
  motivo?: string;
  usuario_id?: number;
  venda_id?: number;
  created_at: string;
  vinhos?: Pick<Vinho, 'id' | 'nome'>;
}

// ============================================
// CAFÉ
// ============================================

export interface EstoqueCafe {
  id: number;
  cafe_id: number;
  quantidade: number;
  localizacao?: string;
  lote?: string;
  data_entrada?: string;
  data_validade?: string;
}

export interface Cafe {
  id: number;
  nome: string;
  tipo_grao?: string;
  torra?: string;
  origem?: string;
  peso_g?: number;
  preco_custo?: number;
  preco_venda: number;
  descricao?: string;
  notas_degustacao?: string;
  created_at?: string;
  updated_at?: string;
  estoque_cafe?: EstoqueCafe[];
}

export interface MovimentacaoEstoqueCafe {
  id: number;
  cafe_id: number;
  tipo: 'entrada' | 'saida' | 'ajuste' | 'perda';
  quantidade: number;
  quantidade_anterior?: number;
  quantidade_nova?: number;
  motivo?: string;
  usuario_id?: number;
  venda_id?: number;
  created_at: string;
  cafes?: Pick<Cafe, 'id' | 'nome'>;
}

// Chat
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ChatRequest {
  message: string;
  userId?: string;
}

export interface ChatResponse {
  response: string;
  action?: string;
}
