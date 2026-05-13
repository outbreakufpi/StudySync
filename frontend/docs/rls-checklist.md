# Checklist de RLS no Supabase

## Objetivo do RLS no Projeto

O Row Level Security (RLS) no Supabase é utilizado para garantir que os dados sejam isolados por usuário. Cada usuário autenticado só pode acessar, modificar ou excluir seus próprios registros nas tabelas relevantes, como `profiles`, `subjects`, `tasks` e `study_sessions`. Isso previne acesso não autorizado a dados de outros usuários, assegurando a privacidade e segurança dos dados pessoais.

## Checklist de Confirmação no Supabase

Para garantir que o RLS esteja corretamente configurado, verifique os seguintes itens no painel do Supabase:

- **RLS habilitado nas tabelas principais:**
  - `profiles`: Deve ter RLS ativado.
  - `subjects`: Deve ter RLS ativado.
  - `tasks`: Deve ter RLS ativado.
  - `study_sessions`: Deve ter RLS ativado.
  - Outras tabelas relacionadas, se aplicável.

- **Policies definidas:**
  - Para cada tabela, confirme a existência de policies que restrinjam operações baseadas no `auth.uid()`.
  - Exemplos genéricos de policies (não execute estes comandos; apenas para referência):
    ```sql
    -- Exemplo de policy para SELECT na tabela profiles
    CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth_uid = auth.uid());
    ```
    ```sql
    -- Exemplo de policy para INSERT na tabela subjects
    CREATE POLICY "Users can insert own subjects" ON subjects
    FOR INSERT WITH CHECK (user_id = auth.uid());
    ```
    ```sql
    -- Exemplo de policy para UPDATE na tabela tasks
    CREATE POLICY "Users can update own tasks" ON tasks
    FOR UPDATE USING (user_id = auth.uid());
    ```
    ```sql
    -- Exemplo de policy para DELETE na tabela study_sessions
    CREATE POLICY "Users can delete own sessions" ON study_sessions
    FOR DELETE USING (user_id = auth.uid());
    ```

- **Relacionamentos de chaves estrangeiras:** Assegure que as tabelas filhas (como `subjects`, `tasks`, `study_sessions`) referenciem corretamente o `user_id` ou similar, ligado ao `auth.uid()`.

## Como Validar o RLS

Para validar se o RLS está funcionando corretamente:

1. **Crie ou use dois usuários diferentes:** Faça login com o primeiro usuário (Usuário A) e realize operações normais (SELECT, INSERT, UPDATE, DELETE) em suas próprias tabelas.

2. **Teste acesso cruzado:**
   - Com o Usuário A logado, tente acessar dados do Usuário B (por exemplo, via queries diretas no Supabase ou através da aplicação).
   - Esperado: Todas as operações cruzadas (SELECT, INSERT, UPDATE, DELETE) devem ser bloqueadas, retornando erros de permissão ou resultados vazios.

3. **Cenários a testar:**
   - SELECT: Tentar visualizar registros de outro usuário.
   - INSERT: Tentar inserir um registro com `user_id` de outro usuário.
   - UPDATE: Tentar atualizar um registro pertencente a outro usuário.
   - DELETE: Tentar excluir um registro de outro usuário.

4. **Ferramentas de validação:** Use o SQL Editor do Supabase ou logs de erro na aplicação para confirmar bloqueios.

## Observação sobre profiles.auth_uid e auth.uid()

A coluna `auth_uid` na tabela `profiles` deve corresponder ao `auth.uid()` fornecido pelo Supabase Auth. Isso é crucial porque as policies de RLS dependem dessa correspondência para autorizar operações. Se houver discrepância (por exemplo, devido a erros na inserção inicial ou migrações), as policies podem falhar, resultando em acesso negado mesmo para o próprio usuário. Sempre verifique que o `auth_uid` seja definido corretamente durante o registro ou login, e que as policies usem `auth.uid()` como referência para isolamento de dados.