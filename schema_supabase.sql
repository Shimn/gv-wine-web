-- ============================================================
-- SCHEMA COMPLETO - LOJA DE VINHOS GV WINE
-- Execute este script no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. TABELAS BASE
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id          BIGSERIAL PRIMARY KEY,
  telegram_id BIGINT UNIQUE NOT NULL,
  username    TEXT,
  first_name  TEXT,
  last_name   TEXT,
  role        TEXT DEFAULT 'vendedor' CHECK (role IN ('admin', 'vendedor', 'cliente')),
  created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id         BIGSERIAL PRIMARY KEY,
  user_id    BIGINT REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categorias (
  id         SERIAL PRIMARY KEY,
  nome       TEXT UNIQUE NOT NULL,
  descricao  TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regioes (
  id         SERIAL PRIMARY KEY,
  pais       TEXT NOT NULL,
  regiao     TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pais, regiao)
);

CREATE TABLE IF NOT EXISTS produtores (
  id         SERIAL PRIMARY KEY,
  nome       TEXT UNIQUE NOT NULL,
  regiao_id  INTEGER REFERENCES regioes(id),
  contato    TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vinhos (
  id               SERIAL PRIMARY KEY,
  nome             TEXT NOT NULL,
  produtor_id      INTEGER REFERENCES produtores(id),
  categoria_id     INTEGER REFERENCES categorias(id),
  safra            INTEGER,
  tipo_uva         TEXT,
  teor_alcoolico   DECIMAL(4,2),
  volume_ml        INTEGER DEFAULT 750,
  preco_custo      DECIMAL(10,2),
  preco_venda      DECIMAL(10,2) NOT NULL,
  descricao        TEXT,
  notas_degustacao TEXT,
  created_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS estoque (
  id            SERIAL PRIMARY KEY,
  vinho_id      INTEGER REFERENCES vinhos(id) ON DELETE CASCADE,
  quantidade    INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  localizacao   TEXT,
  lote          TEXT,
  data_entrada  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  data_validade DATE,
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vinho_id, lote)
);

CREATE TABLE IF NOT EXISTS clientes (
  id              SERIAL PRIMARY KEY,
  nome            TEXT NOT NULL,
  email           TEXT,
  telefone        TEXT,
  cpf_cnpj        TEXT UNIQUE,
  endereco        TEXT,
  cidade          TEXT,
  estado          TEXT,
  cep             TEXT,
  data_nascimento DATE,
  observacoes     TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. TABELAS DE VENDAS
-- ============================================================

CREATE TABLE IF NOT EXISTS vendas (
  id              SERIAL PRIMARY KEY,
  cliente_id      INTEGER REFERENCES clientes(id),
  vendedor_id     BIGINT REFERENCES users(id),
  data_venda      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valor_total     DECIMAL(10,2) NOT NULL,
  desconto        DECIMAL(10,2) DEFAULT 0,
  valor_final     DECIMAL(10,2) NOT NULL,
  forma_pagamento TEXT CHECK (forma_pagamento IN ('dinheiro', 'pix', 'credito', 'debito', 'boleto')),
  status          TEXT DEFAULT 'concluida' CHECK (status IN ('pendente', 'concluida', 'cancelada')),
  observacoes     TEXT,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS itens_venda (
  id             SERIAL PRIMARY KEY,
  venda_id       INTEGER REFERENCES vendas(id) ON DELETE CASCADE,
  vinho_id       INTEGER REFERENCES vinhos(id),
  quantidade     INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal       DECIMAL(10,2) NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id                 SERIAL PRIMARY KEY,
  vinho_id           INTEGER REFERENCES vinhos(id),
  tipo               TEXT NOT NULL CHECK (tipo IN ('entrada', 'saida', 'ajuste', 'perda')),
  quantidade         INTEGER NOT NULL,
  quantidade_anterior INTEGER,
  quantidade_nova    INTEGER,
  motivo             TEXT,
  usuario_id         BIGINT REFERENCES users(id),
  venda_id           INTEGER REFERENCES vendas(id),
  created_at         TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 3. ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_users_telegram_id      ON users(telegram_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id       ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_vinhos_categoria       ON vinhos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_vinhos_produtor        ON vinhos(produtor_id);
CREATE INDEX IF NOT EXISTS idx_estoque_vinho          ON estoque(vinho_id);
CREATE INDEX IF NOT EXISTS idx_vendas_data            ON vendas(data_venda DESC);
CREATE INDEX IF NOT EXISTS idx_vendas_status          ON vendas(status);
CREATE INDEX IF NOT EXISTS idx_vendas_cliente         ON vendas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_venda      ON itens_venda(venda_id);
CREATE INDEX IF NOT EXISTS idx_itens_venda_vinho      ON itens_venda(vinho_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_vinho    ON movimentacoes_estoque(vinho_id);
CREATE INDEX IF NOT EXISTS idx_movimentacoes_data     ON movimentacoes_estoque(created_at DESC);

-- ============================================================
-- 4. FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_users_updated_at    BEFORE UPDATE ON users    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_vinhos_updated_at   BEFORE UPDATE ON vinhos   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_estoque_updated_at  BEFORE UPDATE ON estoque  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE OR REPLACE TRIGGER update_clientes_updated_at BEFORE UPDATE ON clientes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. VIEWS
-- ============================================================

CREATE OR REPLACE VIEW v_estoque_atual AS
SELECT
  v.id             AS vinho_id,
  v.nome           AS vinho,
  p.nome           AS produtor,
  c.nome           AS categoria,
  v.safra,
  v.preco_venda,
  COALESCE(SUM(e.quantidade), 0) AS quantidade_total,
  v.volume_ml,
  e.localizacao
FROM vinhos v
LEFT JOIN estoque    e ON v.id = e.vinho_id
LEFT JOIN produtores p ON v.produtor_id = p.id
LEFT JOIN categorias c ON v.categoria_id = c.id
GROUP BY v.id, v.nome, p.nome, c.nome, v.safra, v.preco_venda, v.volume_ml, e.localizacao;

CREATE OR REPLACE VIEW v_vendas_detalhadas AS
SELECT
  ve.id            AS venda_id,
  ve.data_venda,
  c.nome           AS cliente,
  u.first_name     AS vendedor,
  ve.valor_total,
  ve.desconto,
  ve.valor_final,
  ve.forma_pagamento,
  ve.status,
  COUNT(iv.id)     AS total_itens
FROM vendas ve
LEFT JOIN clientes     c  ON ve.cliente_id = c.id
LEFT JOIN users        u  ON ve.vendedor_id = u.id
LEFT JOIN itens_venda  iv ON ve.id = iv.venda_id
GROUP BY ve.id, ve.data_venda, c.nome, u.first_name,
         ve.valor_total, ve.desconto, ve.valor_final,
         ve.forma_pagamento, ve.status;

CREATE OR REPLACE VIEW v_vinhos_mais_vendidos AS
SELECT
  v.id,
  v.nome,
  p.nome           AS produtor,
  SUM(iv.quantidade) AS total_vendido,
  SUM(iv.subtotal)   AS receita_total
FROM vinhos v
JOIN itens_venda  iv ON v.id  = iv.vinho_id
LEFT JOIN produtores p  ON v.produtor_id = p.id
GROUP BY v.id, v.nome, p.nome
ORDER BY total_vendido DESC;

CREATE OR REPLACE VIEW v_faturamento_diario AS
SELECT
  DATE_TRUNC('day', data_venda)::DATE AS dia,
  COUNT(*)                             AS total_vendas,
  SUM(valor_final)                     AS faturamento,
  AVG(valor_final)                     AS ticket_medio
FROM vendas
WHERE status = 'concluida'
GROUP BY DATE_TRUNC('day', data_venda)::DATE
ORDER BY dia DESC;

-- ============================================================
-- 6. DADOS INICIAIS
-- ============================================================

INSERT INTO categorias (nome, descricao) VALUES
  ('Tinto',     'Vinhos tintos encorpados e frutados'),
  ('Branco',    'Vinhos brancos leves e aromáticos'),
  ('Rosé',      'Vinhos rosé refrescantes'),
  ('Espumante', 'Espumantes e champagnes')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO regioes (pais, regiao) VALUES
  ('Brasil',    'Vale dos Vinhedos'),
  ('Brasil',    'Serra Gaúcha'),
  ('Chile',     'Valle Central'),
  ('Argentina', 'Mendoza'),
  ('Portugal',  'Douro'),
  ('Itália',    'Toscana'),
  ('França',    'Bordeaux')
ON CONFLICT (pais, regiao) DO NOTHING;

INSERT INTO produtores (nome, regiao_id) VALUES
  ('Bodega Norton',    (SELECT id FROM regioes WHERE pais = 'Argentina' LIMIT 1)),
  ('Concha y Toro',    (SELECT id FROM regioes WHERE pais = 'Chile'     LIMIT 1)),
  ('Miolo',            (SELECT id FROM regioes WHERE pais = 'Brasil' AND regiao = 'Serra Gaúcha')),
  ('Casa Valduga',     (SELECT id FROM regioes WHERE pais = 'Brasil' AND regiao = 'Vale dos Vinhedos')),
  ('Quinta do Crasto', (SELECT id FROM regioes WHERE pais = 'Portugal'  LIMIT 1))
ON CONFLICT (nome) DO NOTHING;

-- Vinhos de exemplo
INSERT INTO vinhos (nome, produtor_id, categoria_id, safra, tipo_uva, teor_alcoolico, preco_custo, preco_venda, descricao) VALUES
  ('Malbec Reserva',   (SELECT id FROM produtores WHERE nome = 'Bodega Norton'),  (SELECT id FROM categorias WHERE nome = 'Tinto'),     2021, 'Malbec',         14.0, 45.00,  89.90, 'Encorpado, notas de ameixa e chocolate'),
  ('Cabernet Sauvignon', (SELECT id FROM produtores WHERE nome = 'Concha y Toro'), (SELECT id FROM categorias WHERE nome = 'Tinto'),     2020, 'Cabernet',       13.5, 30.00,  62.00, 'Taninos firmes, sabor intenso de frutas vermelhas'),
  ('Chardonnay',       (SELECT id FROM produtores WHERE nome = 'Miolo'),           (SELECT id FROM categorias WHERE nome = 'Branco'),    2022, 'Chardonnay',     12.5, 28.00,  55.00, 'Leve, fresco, com toque de maçã verde'),
  ('Espumante Brut',   (SELECT id FROM produtores WHERE nome = 'Casa Valduga'),    (SELECT id FROM categorias WHERE nome = 'Espumante'), 2023, 'Chardonnay/Pinot', 11.5, 35.00, 72.00, 'Borbulhas finas, seco e elegante'),
  ('Touriga Nacional', (SELECT id FROM produtores WHERE nome = 'Quinta do Crasto'),(SELECT id FROM categorias WHERE nome = 'Tinto'),     2019, 'Touriga Nacional',14.5, 55.00, 110.00, 'Potente e complexo, terroir português'),
  ('Rosé Frisante',    (SELECT id FROM produtores WHERE nome = 'Miolo'),           (SELECT id FROM categorias WHERE nome = 'Rosé'),      2023, 'Merlot',         11.0, 18.00,  42.00, 'Fresco e levemente frisante')
ON CONFLICT DO NOTHING;

-- Estoque inicial
INSERT INTO estoque (vinho_id, quantidade, localizacao) VALUES
  ((SELECT id FROM vinhos WHERE nome = 'Malbec Reserva'),    24, 'Adega A / Prateleira 1'),
  ((SELECT id FROM vinhos WHERE nome = 'Cabernet Sauvignon'),18, 'Adega A / Prateleira 2'),
  ((SELECT id FROM vinhos WHERE nome = 'Chardonnay'),        30, 'Adega B / Prateleira 1'),
  ((SELECT id FROM vinhos WHERE nome = 'Espumante Brut'),    12, 'Adega B / Prateleira 3'),
  ((SELECT id FROM vinhos WHERE nome = 'Touriga Nacional'),   6, 'Adega A / Prateleira 3'),
  ((SELECT id FROM vinhos WHERE nome = 'Rosé Frisante'),     20, 'Adega B / Prateleira 2')
ON CONFLICT DO NOTHING;

-- Clientes de exemplo
INSERT INTO clientes (nome, email, telefone, cidade, estado) VALUES
  ('João Silva',      'joao@email.com',   '(51) 99999-1111', 'Porto Alegre', 'RS'),
  ('Maria Oliveira',  'maria@email.com',  '(51) 99999-2222', 'Caxias do Sul','RS'),
  ('Carlos Mendes',   'carlos@email.com', '(11) 99999-3333', 'São Paulo',    'SP'),
  ('Ana Souza',       'ana@email.com',    '(21) 99999-4444', 'Rio de Janeiro','RJ'),
  ('Fernando Costa',  'fernando@email.com','(47) 99999-5555','Florianópolis','SC')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7. VENDAS DE EXEMPLO (últimos 30 dias)
-- ============================================================

-- Usuário web padrão (necessário para as vendas)
INSERT INTO users (telegram_id, username, first_name, role) VALUES
  (1, 'web_user', 'Usuário Web', 'vendedor')
ON CONFLICT (telegram_id) DO NOTHING;

-- Vendas
DO $$
DECLARE
  v_malbec    INT := (SELECT id FROM vinhos WHERE nome = 'Malbec Reserva');
  v_cab       INT := (SELECT id FROM vinhos WHERE nome = 'Cabernet Sauvignon');
  v_chard     INT := (SELECT id FROM vinhos WHERE nome = 'Chardonnay');
  v_espum     INT := (SELECT id FROM vinhos WHERE nome = 'Espumante Brut');
  v_touriga   INT := (SELECT id FROM vinhos WHERE nome = 'Touriga Nacional');
  v_rose      INT := (SELECT id FROM vinhos WHERE nome = 'Rosé Frisante');

  c_joao      INT := (SELECT id FROM clientes WHERE nome = 'João Silva');
  c_maria     INT := (SELECT id FROM clientes WHERE nome = 'Maria Oliveira');
  c_carlos    INT := (SELECT id FROM clientes WHERE nome = 'Carlos Mendes');
  c_ana       INT := (SELECT id FROM clientes WHERE nome = 'Ana Souza');
  c_fernando  INT := (SELECT id FROM clientes WHERE nome = 'Fernando Costa');

  u_web       BIGINT := (SELECT id FROM users WHERE telegram_id = 1);

  venda_id INT;
BEGIN

  -- Dia -1 (ontem)
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_joao, u_web, NOW() - INTERVAL '1 day', 179.80, 0, 179.80, 'pix', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_malbec, 2, 89.90, 179.80);

  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_maria, u_web, NOW() - INTERVAL '1 day', 124.00, 10.00, 114.00, 'dinheiro', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_cab, 2, 62.00, 124.00);

  -- Dia -2
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_carlos, u_web, NOW() - INTERVAL '2 days', 110.00, 0, 110.00, 'credito', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_touriga, 1, 110.00, 110.00);

  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_ana, u_web, NOW() - INTERVAL '2 days', 144.00, 0, 144.00, 'pix', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_espum, 2, 72.00, 144.00);

  -- Dia -3
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_fernando, u_web, NOW() - INTERVAL '3 days', 220.00, 20.00, 200.00, 'debito', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_malbec, 1, 89.90, 89.90),
    (venda_id, v_cab,    1, 62.00, 62.00),
    (venda_id, v_rose,   1, 42.00, 42.00);

  -- Dia -5
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_joao, u_web, NOW() - INTERVAL '5 days', 165.00, 0, 165.00, 'pix', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_chard, 3, 55.00, 165.00);

  -- Dia -7
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_maria, u_web, NOW() - INTERVAL '7 days', 89.90, 0, 89.90, 'credito', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_malbec, 1, 89.90, 89.90);

  -- Dia -10
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_carlos, u_web, NOW() - INTERVAL '10 days', 252.00, 0, 252.00, 'boleto', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_espum, 2, 72.00, 144.00),
    (venda_id, v_rose,  2, 42.00, 84.00),
    (venda_id, v_chard, 0.44444::INT, 55.00, 0); -- ajuste

  -- Dia -14
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_ana, u_web, NOW() - INTERVAL '14 days', 330.00, 30.00, 300.00, 'pix', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_touriga, 2, 110.00, 220.00),
    (venda_id, v_malbec,  1, 89.90,  89.90);

  -- Dia -20
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_fernando, u_web, NOW() - INTERVAL '20 days', 62.00, 0, 62.00, 'dinheiro', 'concluida')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_cab, 1, 62.00, 62.00);

  -- Venda cancelada
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_joao, u_web, NOW() - INTERVAL '4 days', 89.90, 0, 89.90, 'credito', 'cancelada')
    RETURNING id INTO venda_id;

  -- Venda pendente
  INSERT INTO vendas (cliente_id, vendedor_id, data_venda, valor_total, desconto, valor_final, forma_pagamento, status)
    VALUES (c_maria, u_web, NOW() - INTERVAL '1 hour', 220.00, 0, 220.00, 'boleto', 'pendente')
    RETURNING id INTO venda_id;
  INSERT INTO itens_venda (venda_id, vinho_id, quantidade, preco_unitario, subtotal) VALUES
    (venda_id, v_malbec, 1, 89.90, 89.90),
    (venda_id, v_touriga,1, 110.00,110.00);

END $$;
