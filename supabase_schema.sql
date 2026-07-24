-- ============================================================
-- JetFlow — Supabase Postgres Schema & RLS Policies
-- ============================================================
-- Execute este script no SQL Editor do seu projeto Supabase.

-- 1. EXTENSÕES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELA DE PERFIS DE USUÁRIOS (CX)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Especialista CX',
  role TEXT DEFAULT 'Especialista de Implantação',
  avatar_initials TEXT DEFAULT 'CX',
  avatar_url TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para criar perfil automaticamente no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'Especialista de Implantação'),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 2))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. TABELAS DE SUPORTE / OPÇÕES (Planos, Módulos, Ofertas, Etapas)
CREATE TABLE IF NOT EXISTS public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.available_offers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.stages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed de dados de suporte iniciais se estiverem vazios
INSERT INTO public.plans (id, name) VALUES
  ('plan1', 'Starter'),
  ('plan2', 'Pro'),
  ('plan3', 'Enterprise'),
  ('plan4', 'Básico')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.modules (id, name, emoji) VALUES
  ('mod1', 'WhatsApp Business', '💬'),
  ('mod2', 'CRM Integrado', '🔗'),
  ('mod3', 'Automação de Fluxos', '⚡'),
  ('mod4', 'IA Conversacional', '🤖'),
  ('mod5', 'Relatórios Avançados', '📊'),
  ('mod6', 'Chatbot Builder', '🛠️'),
  ('mod7', 'API Oficial', '🔌')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.available_offers (id, name) VALUES
  ('off1', 'IA Conversacional'),
  ('off2', 'Relatórios Avançados'),
  ('off3', 'API Oficial'),
  ('off4', 'Suporte Prioritário 24h'),
  ('off5', 'Integração ERP'),
  ('off6', 'White Label'),
  ('off7', 'Multi-atendentes')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.stages (id, name, position) VALUES
  ('stg1', 'Novo', 1),
  ('stg2', 'Kickoff', 2),
  ('stg3', 'Configuração', 3),
  ('stg4', 'Treinamento', 4),
  ('stg5', 'Finalizado', 5)
ON CONFLICT (id) DO NOTHING;

-- 4. TABELA PRINCIPAL DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  cnpj TEXT,
  entry_date TEXT,
  responsible TEXT,
  plan TEXT,
  criticality TEXT DEFAULT 'Estável',
  criticality_justification TEXT,
  observations TEXT,
  stage TEXT DEFAULT 'Novo',
  next_action TEXT,
  next_contact_date TEXT,
  quick_links JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SUB-TABELAS DO CLIENTE
CREATE TABLE IF NOT EXISTS public.client_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  label TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  deadline TEXT,
  criticality TEXT DEFAULT 'Normal',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.last_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  obs TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.activity_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar TEXT,
  name TEXT,
  action TEXT NOT NULL,
  date TEXT NOT NULL,
  is_observation BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. HABILITAR ROW LEVEL SECURITY (RLS) EM TODAS AS TABELAS

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.available_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.last_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_history ENABLE ROW LEVEL SECURITY;

-- 7. POLÍTICAS RLS DE ISOLAMENTO E ACESSO

-- Profiles: cada usuário só edita seu próprio perfil, lê se autenticado
DROP POLICY IF EXISTS "Profiles select policy" ON public.profiles;
CREATE POLICY "Profiles select policy" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Profiles update policy" ON public.profiles;
CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Suporte/Opções (Plans, Modules, Offers, Stages): Leitura liberada para autenticados
DROP POLICY IF EXISTS "Plans read policy" ON public.plans;
CREATE POLICY "Plans read policy" ON public.plans FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Plans modify policy" ON public.plans;
CREATE POLICY "Plans modify policy" ON public.plans FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Modules read policy" ON public.modules;
CREATE POLICY "Modules read policy" ON public.modules FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Modules modify policy" ON public.modules;
CREATE POLICY "Modules modify policy" ON public.modules FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Offers read policy" ON public.available_offers;
CREATE POLICY "Offers read policy" ON public.available_offers FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Offers modify policy" ON public.available_offers;
CREATE POLICY "Offers modify policy" ON public.available_offers FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Stages read policy" ON public.stages;
CREATE POLICY "Stages read policy" ON public.stages FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Stages modify policy" ON public.stages;
CREATE POLICY "Stages modify policy" ON public.stages FOR ALL USING (auth.role() = 'authenticated');

-- CLIENTS: Isolamento ESTRITO por owner_id (auth.uid() = owner_id)
DROP POLICY IF EXISTS "Clients owner policy" ON public.clients;
CREATE POLICY "Clients owner policy" ON public.clients
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- CLIENT_MODULES: Isolamento ESTRITO por owner_id
DROP POLICY IF EXISTS "Client modules owner policy" ON public.client_modules;
CREATE POLICY "Client modules owner policy" ON public.client_modules
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- CHECKLISTS: Isolamento ESTRITO por owner_id
DROP POLICY IF EXISTS "Checklists owner policy" ON public.checklists;
CREATE POLICY "Checklists owner policy" ON public.checklists
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- REMINDERS: Isolamento ESTRITO por owner_id
DROP POLICY IF EXISTS "Reminders owner policy" ON public.reminders;
CREATE POLICY "Reminders owner policy" ON public.reminders
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- LAST_CONTACTS: Isolamento ESTRITO por owner_id
DROP POLICY IF EXISTS "Last contacts owner policy" ON public.last_contacts;
CREATE POLICY "Last contacts owner policy" ON public.last_contacts
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- ACTIVITY_HISTORY: Isolamento ESTRITO por owner_id
DROP POLICY IF EXISTS "Activity history owner policy" ON public.activity_history;
CREATE POLICY "Activity history owner policy" ON public.activity_history
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);
