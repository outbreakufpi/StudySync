import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const outPath = path.resolve(process.cwd(), 'scripts', 'seed.sql');

// Basic example seed with users, profiles, subjects, tasks, sessions
const sql = `-- StudySync seed data

-- Users (created via Supabase auth normally)
-- For testing we only create profiles, subjects, tasks and sessions linked by email/auth_uid

INSERT INTO profiles (id, full_name, email, avatar_url, metadata, current_mode, created_at)
VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'Alice Teste', 'alice@test.local', NULL, '{"login_count": 5}'::jsonb, 'university', now()),
  ('00000000-0000-0000-0000-0000000000b2', 'Bruno Concurso', 'bruno@test.local', NULL, '{"login_count": 12}'::jsonb, 'competitive', now())
ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name;

-- Subjects
INSERT INTO subjects (id, name, professor, room, color, code, mode, is_active, created_at)
VALUES
  (gen_random_uuid(), 'Álgebra Linear', 'Prof. Souza', 'Sala 101', '#006a60', 'MAT101', 'university', true, now()),
  (gen_random_uuid(), 'Macroeconomia', 'Prof. Lima', 'Sala 204', '#0055aa', 'ECO201', 'university', true, now()),
  (gen_random_uuid(), 'Direito Constitucional', 'Prof. Rosa', NULL, '#aa5500', 'DIR300', 'competitive', true, now())
ON CONFLICT DO NOTHING;

-- Tasks
INSERT INTO tasks (id, title, description, subject_id, due_date, status, priority, type, metadata, created_at)
VALUES
  (gen_random_uuid(), 'Prova Semestral: Álgebra Linear', 'Estudar capítulos 1-5', (SELECT id FROM subjects WHERE name = 'Álgebra Linear' LIMIT 1), now() + interval '7 days', 'todo', 2, 'exam', '{}'::jsonb, now()),
  (gen_random_uuid(), 'Trabalho de Análise de Mercado', 'Redigir relatório de 2.000 palavras', (SELECT id FROM subjects WHERE name = 'Macroeconomia' LIMIT 1), now() + interval '10 days', 'todo', 1, 'task', '{}'::jsonb, now())
ON CONFLICT DO NOTHING;

-- Sessions
INSERT INTO sessions (id, subject_id, started_at, ended_at, duration_minutes, questions_answered, metadata, created_at)
VALUES
  (gen_random_uuid(), (SELECT id FROM subjects WHERE name = 'Direito Constitucional' LIMIT 1), now() - interval '2 days', now() - interval '2 days' + interval '90 minutes', 90, 40, '{"is_simulado": true, "score": 82, "simulado_name": "Receita Federal"}'::jsonb, now()),
  (gen_random_uuid(), (SELECT id FROM subjects WHERE name = 'Álgebra Linear' LIMIT 1), now() - interval '1 day', now() - interval '1 day' + interval '60 minutes', 60, 0, '{"duration_minutes": 60}'::jsonb, now())
ON CONFLICT DO NOTHING;
`;

fs.writeFileSync(outPath, sql, 'utf8');
console.log('Wrote seed SQL to', outPath);

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log('\nNo DATABASE_URL found in .env. To execute the seed automatically, set DATABASE_URL and ensure psql is available.');
  console.log('Alternatively run: psql "$DATABASE_URL" -f scripts/seed.sql');
  process.exit(0);
}

try {
  console.log('Executing seed via psql...');
  execSync(`psql "$DATABASE_URL" -f ${outPath}`, { stdio: 'inherit' });
  console.log('Seed executed successfully.');
} catch (err) {
  console.error('Failed to execute seed automatically:', err.message);
  console.log('You can run manually: psql "$DATABASE_URL" -f scripts/seed.sql');
}
