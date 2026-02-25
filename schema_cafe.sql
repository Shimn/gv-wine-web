-- ============================================
-- SCHEMA PARA GESTÃO DE CAFÉS
-- Extensão do sistema GV Wine Web
-- ============================================

-- Tabela principal de cafés (produtos)
CREATE TABLE IF NOT EXISTS cafes (
  id SERIAL PRIMARY KEY,
  nome TEXT NOT NULL,
  tipo_grao TEXT,               -- Arábica, Robusta, Blend
  torra TEXT,                   -- Clara, Média, Média-Escura, Escura
  formato TEXT CHECK (formato IN ('capsula', 'grao', 'moido')),  -- Cápsula, Grão inteiro, Moído
  origem TEXT,                  -- Brasil, Colômbia, Etiópia, etc
  peso_g INTEGER DEFAULT 250,   -- Peso em gramas (250g padrão)
  preco_custo DECIMAL(10,2),
  preco_venda DECIMAL(10,2) NOT NULL,
  descricao TEXT,
  notas_degustacao TEXT,         -- Aromas, acidez, corpo, finalização
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de estoque de café
CREATE TABLE IF NOT EXISTS estoque_cafe (
  id SERIAL PRIMARY KEY,
  cafe_id INTEGER REFERENCES cafes(id) ON DELETE CASCADE,
  quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  localizacao TEXT,
  lote TEXT,
  data_entrada TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_validade DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(cafe_id, lote)
);

-- Tabela de movimentações de estoque de café (log)
CREATE TABLE IF NOT EXISTS movimentacoes_estoque_cafe (
  id SERIAL PRIMARY KEY,
  cafe_id INTEGER REFERENCES cafes(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'perda')),
  quantidade INTEGER NOT NULL,
  quantidade_anterior INTEGER,
  quantidade_nova INTEGER,
  motivo TEXT,
  usuario_id BIGINT REFERENCES users(id),
  venda_id INTEGER REFERENCES vendas(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adicionar coluna cafe_id na tabela itens_venda (para vendas de café)
ALTER TABLE itens_venda ADD COLUMN IF NOT EXISTS cafe_id INTEGER REFERENCES cafes(id);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_cafes_nome ON cafes(nome);
CREATE INDEX IF NOT EXISTS idx_estoque_cafe_id ON estoque_cafe(cafe_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_cafe_id ON movimentacoes_estoque_cafe(cafe_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_cafe ON itens_venda(cafe_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Trigger updated_at para cafes
CREATE TRIGGER update_cafes_updated_at
  BEFORE UPDATE ON cafes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger updated_at para estoque_cafe
CREATE TRIGGER update_estoque_cafe_updated_at
  BEFORE UPDATE ON estoque_cafe
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMENTÁRIOS NAS TABELAS
-- ============================================

COMMENT ON TABLE cafes IS 'Catálogo de cafés disponíveis';
COMMENT ON TABLE estoque_cafe IS 'Controle de estoque de café atual';
COMMENT ON TABLE movimentacoes_estoque_cafe IS 'Histórico de movimentações de estoque de café';
