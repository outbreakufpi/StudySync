-- StudySync - Supabase test commands
-- Execute these queries in Supabase SQL Editor after importing the schema.

-- 1) Verify tables exist
select table_schema, table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'modes',
    'subjects',
    'tasks',
    'study_sessions',
    'calendar_events',
    'notifications'
  )
order by table_name;

-- 2) Verify columns on the main tables
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name in ('profiles', 'subjects', 'tasks', 'study_sessions', 'calendar_events', 'notifications')
order by table_name, ordinal_position;

-- 3) Verify RLS is enabled
select schemaname, tablename, rowsecurity
from pg_tables
join pg_class on pg_class.relname = pg_tables.tablename
join pg_namespace on pg_namespace.nspname = pg_tables.schemaname and pg_namespace.oid = pg_class.relnamespace
where schemaname = 'public'
  and tablename in ('profiles', 'subjects', 'tasks', 'study_sessions', 'calendar_events', 'notifications')
order by tablename;

-- 4) Check policies created
select schemaname, tablename, policyname, permissive, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('profiles', 'subjects', 'tasks', 'study_sessions', 'calendar_events', 'notifications')
order by tablename, policyname;

-- 5) Check indexes created
select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('profiles', 'subjects', 'tasks', 'study_sessions', 'calendar_events', 'notifications')
order by tablename, indexname;

-- 6) Quick smoke test for inserts
-- Replace the values below with a real authenticated user id/profile row.
-- Expected: insert a profile first, then a subject, then a task.

insert into public.profiles (auth_uid, full_name, email, current_mode)
values ('test-auth-uid-001', 'Teste StudySync', 'teste@studysync.local', 'university')
on conflict (auth_uid) do nothing;

insert into public.subjects (user_id, mode, name, professor, room, color, code)
select p.id, 'university', 'Arquitetura de Software', 'Prof. Exemplo', 'Sala 101', '#3366ff', 'ARQ101'
from public.profiles p
where p.auth_uid = 'test-auth-uid-001'
on conflict do nothing;

insert into public.tasks (user_id, subject_id, title, description, type, status, priority, estimated_minutes)
select p.id, s.id, 'Ler capítulo 1', 'Validar fluxo básico de tarefas', 'task', 'todo', 1, 60
from public.profiles p
join public.subjects s on s.user_id = p.id
where p.auth_uid = 'test-auth-uid-001'
  and s.name = 'Arquitetura de Software'
on conflict do nothing;

select p.full_name, s.name as subject_name, t.title, t.status
from public.tasks t
join public.profiles p on p.id = t.user_id
left join public.subjects s on s.id = t.subject_id
where p.auth_uid = 'test-auth-uid-001';

-- 7) Cleanup opcional
-- delete from public.tasks where user_id = (select id from public.profiles where auth_uid = 'test-auth-uid-001');
-- delete from public.subjects where user_id = (select id from public.profiles where auth_uid = 'test-auth-uid-001');
-- delete from public.profiles where auth_uid = 'test-auth-uid-001';
