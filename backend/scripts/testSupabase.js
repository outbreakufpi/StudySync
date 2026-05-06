import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../.env');

dotenv.config({ path: envPath });

const { supabase, supabaseAdmin } = await import('../src/config/supabaseClient.js');

const supabaseClient = supabaseAdmin || supabase;
const activeClient = supabaseAdmin ? 'supabaseAdmin (service role)' : 'supabase (anon key)';
const TEST_USER_UID = 'test-auth-uid-001';

async function run() {
  console.log('--- Supabase test script ---');
  console.log('Usando cliente:', activeClient);

  const profilePayload = {
    auth_uid: TEST_USER_UID,
    full_name: 'Teste StudySync',
    email: 'teste@studysync.local',
    avatar_url: 'https://ui-avatars.com/api/?name=Teste+StudySync',
    current_mode: 'university',
    timezone: 'America/Sao_Paulo',
    locale: 'pt-BR'
  };

  const modePayload = {
    key: 'university',
    name: 'Universitário',
    description: 'Modo para organização de matérias e tarefas de universidade'
  };

  const subjectPayload = {
    mode: 'university',
    name: 'Arquitetura de Software',
    professor: 'Prof. Silva',
    room: 'Sala 101',
    color: '#3366ff',
    code: 'ARQ101'
  };

  const taskPayload = {
    title: 'Ler capítulo 1',
    description: 'Validar fluxo básico de tarefas',
    type: 'task',
    status: 'todo',
    priority: 1,
    estimated_minutes: 60
  };

  const sessionPayload = {
    started_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    ended_at: new Date().toISOString(),
    questions_answered: 12,
    depth: 3,
    notes: 'Sessão de teste para simular estudo competitivo.'
  };

  const eventPayload = {
    title: 'Revisão de software',
    description: 'Evento gerado durante o teste de integração',
    start_at: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
    end_at: new Date(Date.now() + 1000 * 60 * 90).toISOString(),
    is_all_day: false
  };

  const notificationPayload = {
    type: 'welcome',
    payload: { message: 'Bem-vindo ao StudySync!', source: 'teste' },
    read: false
  };

  // 1) Inserir e ler profile
  console.log('\n1) Inserindo profile...');
  const { data: profileData, error: profileError } = await supabaseClient
    .from('profiles')
    .insert([profilePayload])
    .select()
    .single();

  if (profileError) {
    console.error('Erro ao inserir profile:', profileError);
    return;
  }

  console.log('Profile inserido:', profileData);

  console.log('\n2) Inserindo mode de catálogo...');
  const { data: modeData, error: modeError } = await supabaseClient
    .from('modes')
    .upsert([modePayload], { onConflict: 'key' })
    .select()
    .single();

  if (modeError) {
    console.error('Erro ao inserir mode:', modeError);
    return;
  }

  console.log('Mode inserido:', modeData);

  const userId = profileData.id;
  subjectPayload.user_id = userId;
  taskPayload.user_id = userId;
  sessionPayload.user_id = userId;
  eventPayload.user_id = userId;
  notificationPayload.user_id = userId;

  // 2) Inserir e ler subject
  console.log('\n2) Inserindo subject...');
  const { data: subjectData, error: subjectError } = await supabaseClient
    .from('subjects')
    .insert([subjectPayload])
    .select()
    .single();

  if (subjectError) {
    console.error('Erro ao inserir subject:', subjectError);
    return;
  }

  console.log('Subject inserido:', subjectData);

  const subjectId = subjectData.id;
  taskPayload.subject_id = subjectId;
  sessionPayload.subject_id = subjectId;

  // 3) Inserir e ler task
  console.log('\n3) Inserindo task...');
  const { data: taskData, error: taskError } = await supabaseClient
    .from('tasks')
    .insert([taskPayload])
    .select()
    .single();

  if (taskError) {
    console.error('Erro ao inserir task:', taskError);
    return;
  }

  console.log('Task inserida:', taskData);

  // 4) Inserir e ler study_session
  console.log('\n4) Inserindo study_session...');
  const { data: sessionData, error: sessionError } = await supabaseClient
    .from('study_sessions')
    .insert([sessionPayload])
    .select()
    .single();

  if (sessionError) {
    console.error('Erro ao inserir study_session:', sessionError);
    return;
  }

  console.log('Study session inserida:', sessionData);

  // 5) Inserir e ler calendar_event
  eventPayload.task_id = taskData.id;
  eventPayload.session_id = sessionData.id;

  console.log('\n5) Inserindo calendar_event...');
  const { data: eventData, error: eventError } = await supabaseClient
    .from('calendar_events')
    .insert([eventPayload])
    .select()
    .single();

  if (eventError) {
    console.error('Erro ao inserir calendar_event:', eventError);
    return;
  }

  console.log('Calendar event inserido:', eventData);

  // 6) Inserir e ler notification
  console.log('\n6) Inserindo notification...');
  const { data: notificationData, error: notificationError } = await supabaseClient
    .from('notifications')
    .insert([notificationPayload])
    .select()
    .single();

  if (notificationError) {
    console.error('Erro ao inserir notification:', notificationError);
    return;
  }

  console.log('Notification inserida:', notificationData);

  // 7) Consultas finais
  console.log('\n7) Consultando dados inseridos...');
  const { data: finalProfile } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('auth_uid', TEST_USER_UID)
    .single();
  const { data: finalModes } = await supabaseClient
    .from('modes')
    .select('*')
    .eq('key', modePayload.key)
    .single();
  const { data: finalSubjects } = await supabaseClient
    .from('subjects')
    .select('*')
    .eq('user_id', userId);
  const { data: finalTasks } = await supabaseClient
    .from('tasks')
    .select('*')
    .eq('user_id', userId);

  console.log('\nProfile final:', finalProfile);
  console.log('\nMode final:', finalModes);
  console.log('\nSubjects finais:', finalSubjects);
  console.log('\nTasks finais:', finalTasks);

  console.log('\nTeste concluído com sucesso!');
}

run().catch((err) => {
  console.error('Erro inesperado:', err);
});
