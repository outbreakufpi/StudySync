-- StudySync — Supabase schema (Sprint 08)
-- Rascunho DDL para revisão

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tipos ENUM
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'mode_type') THEN
        CREATE TYPE mode_type AS ENUM ('university','competitive');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
        CREATE TYPE task_type AS ENUM ('task','exam','reminder');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status') THEN
        CREATE TYPE task_status AS ENUM ('todo','in_progress','done','archived');
    END IF;
END$$;

-- 1) profiles (extensão do Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid text UNIQUE, -- armazenar sub do JWT (supabase auth uid)
  full_name text,
  email text UNIQUE,
  avatar_url text,
  current_mode mode_type DEFAULT 'university',
  timezone text,
  locale text DEFAULT 'pt-BR',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profiles_auth_uid_idx ON public.profiles(auth_uid);

-- 2) modes (catálogo opcional)
CREATE TABLE IF NOT EXISTS public.modes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- 3) subjects / disciplines
CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode mode_type DEFAULT 'university',
  name text NOT NULL,
  professor text,
  room text,
  color varchar(7),
  code text,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS subjects_user_idx ON public.subjects(user_id);
CREATE INDEX IF NOT EXISTS subjects_mode_idx ON public.subjects(mode);

-- 4) tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  type task_type DEFAULT 'task',
  status task_status DEFAULT 'todo',
  priority smallint DEFAULT 0,
  due_date timestamptz,
  estimated_minutes integer,
  completed_at timestamptz,
  recurrence jsonb,
  tags text[],
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_user_idx ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS tasks_subject_idx ON public.tasks(subject_id);
CREATE INDEX IF NOT EXISTS tasks_user_status_idx ON public.tasks(user_id, status);

-- 5) study_sessions
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject_id uuid REFERENCES public.subjects(id) ON DELETE SET NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz NOT NULL,
  duration_minutes integer GENERATED ALWAYS AS (CAST((EXTRACT(EPOCH FROM (ended_at - started_at))/60) AS integer)) STORED,
  questions_answered integer DEFAULT 0,
  depth smallint,
  notes text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS study_sessions_user_idx ON public.study_sessions(user_id);
CREATE INDEX IF NOT EXISTS study_sessions_subject_idx ON public.study_sessions(subject_id);
CREATE INDEX IF NOT EXISTS study_sessions_user_started_idx ON public.study_sessions(user_id, started_at DESC);

-- 6) calendar_events
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE SET NULL,
  session_id uuid REFERENCES public.study_sessions(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  is_all_day boolean DEFAULT false,
  recurrence jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS calendar_events_user_idx ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS calendar_events_start_idx ON public.calendar_events(start_at);

-- 7) notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL,
  payload jsonb,
  read boolean DEFAULT false,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_user_read_idx ON public.notifications(user_id, read);

-- Observações: considerar adicionar deleted_at timestamptz para soft deletes quando necessário.

-- RLS POLICIES SUGERIDAS (Exemplos)

-- Assumimos que `auth.uid()` retorna o sub do JWT (texto) e que esse valor está armazenado em `profiles.auth_uid`.
-- Se você for usar `profiles.id = auth.uid()::uuid`, ajuste as policies adequadamente.

-- Habilitar RLS em tabelas suportadas
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy helper (legibilidade): verificar que o profile existe e corresponde ao auth uid
-- Nota: policies abaixo usam EXISTS correlacionado para comparar `profiles.auth_uid = auth.uid()` com as linhas que contêm `user_id`.

-- Profiles: permitir leitura pública limitada, updates apenas ao próprio usuário
CREATE POLICY profiles_select_self_or_public ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE USING (auth.uid() IS NOT NULL AND auth.uid()::text = auth_uid) WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = auth_uid);

-- Subjects
CREATE POLICY subjects_select_own ON public.subjects
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );
CREATE POLICY subjects_modify_own ON public.subjects
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );

-- Tasks
CREATE POLICY tasks_select_own ON public.tasks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );
CREATE POLICY tasks_modify_own ON public.tasks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );

-- Study sessions
CREATE POLICY sessions_select_own ON public.study_sessions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );
CREATE POLICY sessions_modify_own ON public.study_sessions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );

-- Calendar events
CREATE POLICY events_select_own ON public.calendar_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );
CREATE POLICY events_modify_own ON public.calendar_events
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );

-- Notifications
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );
CREATE POLICY notifications_modify_own ON public.notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_id AND p.auth_uid = auth.uid()::text)
  );

-- Nota final: Revise as policies para seu fluxo de auth. Se `profiles.id = auth.uid()::uuid` for usado, simplifique as checks para `user_id = auth.uid()::uuid`.

-- Fim do rascunho
