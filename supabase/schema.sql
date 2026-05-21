-- RP Structure — Supabase schema
-- Rodar no SQL Editor do Supabase Dashboard

CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Permite todas as operações (sem autenticação por enquanto)
CREATE POLICY "Allow all operations" ON clients
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Atualiza updated_at automaticamente em cada UPDATE
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
