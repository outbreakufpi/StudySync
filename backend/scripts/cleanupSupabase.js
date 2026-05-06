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
  console.log('--- Supabase cleanup script ---');
  console.log('Usando cliente:', activeClient);

  console.log('\n1) Localizando profile de teste...');
  const { data: profile, error: findError } = await supabaseClient
    .from('profiles')
    .select('id, auth_uid')
    .eq('auth_uid', TEST_USER_UID)
    .single();

  if (findError && findError.code !== 'PGRST116') {
    console.error('Erro ao localizar profile:', findError);
    return;
  }

  if (!profile) {
    console.log('Profile de teste não encontrado. Não há dados para remover no perfil.');
  } else {
    console.log('Profile encontrado:', profile);
    console.log('2) Excluindo profile e registros relacionados...');

    const { error: deleteProfileError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('auth_uid', TEST_USER_UID);

    if (deleteProfileError) {
      console.error('Erro ao excluir profile:', deleteProfileError);
      return;
    }

    console.log('Profile de teste removido com sucesso.');
  }

  console.log('\n3) Removendo mode de teste...');
  const { error: deleteModeError } = await supabaseClient
    .from('modes')
    .delete()
    .eq('key', 'university')
    .eq('description', 'Modo para organização de matérias e tarefas de universidade');

  if (deleteModeError) {
    console.error('Erro ao excluir mode de teste:', deleteModeError);
    return;
  }

  console.log('Mode de teste removido (se existia).');
  console.log('\n4) Verificação final:');

  const { data: profileAfter } = await supabaseClient
    .from('profiles')
    .select('id')
    .eq('auth_uid', TEST_USER_UID)
    .single();

  console.log('Profile restante:', profileAfter ?? 'nenhum');
  console.log('Cleanup concluído.');
}

run().catch((err) => {
  console.error('Erro inesperado:', err);
});
