-- ============================================
-- SCHEMA DE PERFIS / USUÁRIOS
-- Extensão do sistema GV Wine Web
-- ============================================

-- Tabela de perfis (vinculada ao auth.users do Supabase)
CREATE TABLE IF NOT EXISTS perfis (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendedor' CHECK (role IN ('admin', 'vendedor', 'viewer')),
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_perfis_email ON perfis(email);
CREATE INDEX IF NOT EXISTS idx_perfis_role ON perfis(role);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_perfis_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_perfis_updated ON perfis;
CREATE TRIGGER trigger_perfis_updated
  BEFORE UPDATE ON perfis
  FOR EACH ROW
  EXECUTE FUNCTION update_perfis_timestamp();

-- RLS (Row Level Security)
ALTER TABLE perfis ENABLE ROW LEVEL SECURITY;

-- Política: qualquer usuário autenticado pode ler perfis
CREATE POLICY "perfis_select_authenticated"
  ON perfis FOR SELECT
  TO authenticated
  USING (true);

-- Política: apenas o próprio usuário ou admin pode atualizar
CREATE POLICY "perfis_update_own_or_admin"
  ON perfis FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
  );

-- Política: apenas admin pode inserir
CREATE POLICY "perfis_insert_admin"
  ON perfis FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM perfis WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================
-- INSTRUÇÕES DE SETUP
-- ============================================
-- 1. Execute este SQL no Supabase SQL Editor
-- 2. Crie o primeiro usuário admin manualmente:
--    a) No Dashboard Supabase → Authentication → Users → Add User
--    b) Depois insira o perfil:
--       INSERT INTO perfis (id, email, nome, role, ativo)
--       VALUES ('<UUID-do-user>', 'admin@email.com', 'Administrador', 'admin', true);
-- 3. Configure as variáveis de ambiente:
--    NEXT_PUBLIC_SUPABASE_URL=...
--    NEXT_PUBLIC_SUPABASE_ANON_KEY=...
--    SUPABASE_URL=...          (mesmo valor, para server-side)
--    SUPABASE_KEY=...          (service_role key, para admin.createUser)
