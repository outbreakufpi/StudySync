-- Seed SQL (idempotent) for StudySync
-- Paste into Supabase SQL editor or run with psql against DATABASE_URL

-- 1) Ensure modes exist
INSERT INTO public.modes (key, name, description)
VALUES
  ('university','Universidade','Modo universitário'),
  ('concurso','Concurso','Modo concurso')
ON CONFLICT (key) DO NOTHING;

-- 2) Test profile (unique by email)
INSERT INTO public.profiles (id, auth_uid, full_name, email, timezone, locale, current_mode, metadata)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'seed-auth', 'Usuário Teste', 'seed@example.com', 'America/Sao_Paulo', 'pt-BR', 'university'::mode_type, '{}'::jsonb)
ON CONFLICT (email) DO NOTHING;

-- 3) Subject for the test user
WITH u AS (
  SELECT id AS user_id FROM public.profiles WHERE email = 'seed@example.com' LIMIT 1
)
INSERT INTO public.subjects (id, user_id, mode, name, professor, room, code, color, is_active)
SELECT gen_random_uuid(), u.user_id, 'university'::mode_type, 'Introdução à Economia', 'Prof. Silva', 'Sala 101', 'ECO101', '#4F46E5', true
FROM u
WHERE NOT EXISTS (
  SELECT 1 FROM public.subjects s WHERE s.user_id = u.user_id AND s.name = 'Introdução à Economia'
);

-- 4) Task (use existing enum values: 'task' and 'todo')
WITH u AS (
  SELECT id AS user_id FROM public.profiles WHERE email = 'seed@example.com' LIMIT 1
), s AS (
  SELECT id AS subject_id FROM public.subjects WHERE user_id = (SELECT user_id FROM u) AND name = 'Introdução à Economia' LIMIT 1
)
INSERT INTO public.tasks (id, user_id, subject_id, title, description, type, status, priority, due_date, estimated_minutes, metadata)
SELECT gen_random_uuid(), u.user_id, s.subject_id, 'Trabalho de Análise de Mercado', 'Analisar dados de mercado e preparar relatório', 'task'::task_type, 'todo'::task_status, 1, now() + interval '7 days', 180, '{}'::jsonb
FROM u, s
WHERE NOT EXISTS (
  SELECT 1 FROM public.tasks t WHERE t.user_id = u.user_id AND t.title = 'Trabalho de Análise de Mercado'
);

-- 5) Study session for test user
WITH u AS (
  SELECT id AS user_id FROM public.profiles WHERE email = 'seed@example.com' LIMIT 1
), s AS (
  SELECT id AS subject_id FROM public.subjects WHERE user_id = (SELECT user_id FROM u) AND name = 'Introdução à Economia' LIMIT 1
)
INSERT INTO public.study_sessions (id, user_id, subject_id, started_at, ended_at, questions_answered, depth, notes, metadata)
SELECT gen_random_uuid(), u.user_id, s.subject_id, now() - interval '3 days', now() - interval '3 days' + interval '1 hour', 20, 2, 'Sessão de revisão: capítulos 1-3', '{}'::jsonb
FROM u, s
WHERE NOT EXISTS (
  SELECT 1 FROM public.study_sessions ss WHERE ss.user_id = u.user_id AND ss.notes = 'Sessão de revisão: capítulos 1-3'
);

-- 6) Calendar event linking to the created task/session
WITH u AS (
  SELECT id AS user_id FROM public.profiles WHERE email = 'seed@example.com' LIMIT 1
), t AS (
  SELECT id AS task_id FROM public.tasks WHERE user_id = (SELECT user_id FROM u) AND title = 'Trabalho de Análise de Mercado' LIMIT 1
), ss AS (
  SELECT id AS session_id FROM public.study_sessions WHERE user_id = (SELECT user_id FROM u) ORDER BY created_at LIMIT 1
)
INSERT INTO public.calendar_events (id, user_id, task_id, session_id, title, description, start_at, end_at, is_all_day, metadata)
SELECT gen_random_uuid(), u.user_id, t.task_id, ss.session_id, 'Entrega: Trabalho de Mercado', 'Prazo para entrega do trabalho', now() + interval '6 days', now() + interval '6 days' + interval '1 hour', false, '{}'::jsonb
FROM u, t, ss
WHERE NOT EXISTS (
  SELECT 1 FROM public.calendar_events ce WHERE ce.user_id = u.user_id AND ce.title = 'Entrega: Trabalho de Mercado'
);

-- 7) Notification for the user
WITH u AS (
  SELECT id AS user_id FROM public.profiles WHERE email = 'seed@example.com' LIMIT 1
)
INSERT INTO public.notifications (id, user_id, type, payload, read)
SELECT gen_random_uuid(), u.user_id, 'seed'::text, '{"message":"Bem-vindo ao StudySync — dados de exemplo carregados"}'::jsonb, false
FROM u
WHERE NOT EXISTS (
  SELECT 1 FROM public.notifications n WHERE n.user_id = u.user_id AND n.type = 'seed'
);

-- 8) Quick sanity check
SELECT 'seed_done' AS status, (SELECT COUNT(*) FROM public.profiles WHERE email = 'seed@example.com') AS profiles_inserted;
