# Checklist de Testes Manuais - Sprint 08: Modo Universitário/Concurso

Esta checklist visa validar o funcionamento do modo universitário/concurso, incluindo funcionalidades de cadastro, login, gerenciamento de disciplinas (subjects) e tarefas (tasks), permissões RLS e casos negativos.

## 1. Cadastro e Login

- [ ] **Passo:** Acesse a página de registro e preencha todos os campos obrigatórios (nome, email, senha). Clique em "Registrar".
  **Resultado esperado:** Usuário é criado com sucesso, redirecionado para login ou dashboard, e recebe confirmação (ex.: email de verificação ou mensagem de sucesso).

- [ ] **Passo:** Tente registrar com um email já existente.
  **Resultado esperado:** Erro 400 ou mensagem indicando que o email já está em uso.

- [ ] **Passo:** Acesse a página de login e insira credenciais válidas. Clique em "Entrar".
  **Resultado esperado:** Login bem-sucedido, redirecionamento para dashboard, e token de autenticação gerado (verificar no localStorage ou cookies).

- [ ] **Passo:** Tente fazer login com senha incorreta.
  **Resultado esperado:** Erro 401 ou mensagem de "Credenciais inválidas".

- [ ] **Passo:** Tente fazer login com email inexistente.
  **Resultado esperado:** Erro 401 ou mensagem de "Usuário não encontrado".

## 2. Gerenciamento de Disciplinas (Subjects)

- [ ] **Passo:** Após login, acesse a seção de disciplinas e clique em "Criar Disciplina". Preencha nome e descrição. Clique em "Salvar".
  **Resultado esperado:** Disciplina criada com sucesso, aparece na lista de disciplinas do usuário.

- [ ] **Passo:** Na lista de disciplinas, verifique se todas as disciplinas do usuário logado são exibidas.
  **Resultado esperado:** Apenas as disciplinas do usuário atual são listadas (não de outros usuários).

- [ ] **Passo:** Selecione uma disciplina da lista e clique em "Editar". Altere o nome ou descrição e salve.
  **Resultado esperado:** Disciplina atualizada com sucesso, mudanças refletidas na lista.

- [ ] **Passo:** Selecione uma disciplina e clique em "Remover". Confirme a exclusão.
  **Resultado esperado:** Disciplina removida da lista, não aparece mais.

## 3. Gerenciamento de Tarefas (Tasks)

- [ ] **Passo:** Acesse a seção de tarefas e clique em "Criar Tarefa". Preencha título, descrição e associe a uma disciplina (subject_id). Clique em "Salvar".
  **Resultado esperado:** Tarefa criada com sucesso, associada à disciplina, aparece na lista de tarefas.

- [ ] **Passo:** Crie uma tarefa sem associar a uma disciplina (subject_id vazio ou null).
  **Resultado esperado:** Tarefa criada sem disciplina, aparece na lista de tarefas gerais.

- [ ] **Passo:** Na lista de tarefas, verifique se todas as tarefas do usuário logado são exibidas, incluindo as associadas e não associadas a disciplinas.
  **Resultado esperado:** Apenas as tarefas do usuário atual são listadas.

- [ ] **Passo:** Selecione uma tarefa e clique em "Editar". Faça uma edição parcial (ex.: apenas o título) usando PATCH e salve.
  **Resultado esperado:** Tarefa atualizada parcialmente, mudanças refletidas na lista.

- [ ] **Passo:** Selecione uma tarefa e clique em "Remover". Confirme a exclusão.
  **Resultado esperado:** Tarefa removida da lista, não aparece mais.

## 4. Verificação de Permissões RLS (Row Level Security)

- [ ] **Passo:** Crie uma segunda conta de usuário (registro e login).
  **Resultado esperado:** Segunda conta criada e logada com sucesso.

- [ ] **Passo:** Com a primeira conta, crie algumas disciplinas e tarefas. Em seguida, faça login com a segunda conta e verifique a lista de disciplinas e tarefas.
  **Resultado esperado:** A segunda conta não vê nenhuma disciplina ou tarefa da primeira conta (dados isolados por usuário).

- [ ] **Passo:** Com a segunda conta, crie suas próprias disciplinas e tarefas. Verifique se elas não aparecem para a primeira conta ao fazer login novamente.
  **Resultado esperado:** Dados permanecem isolados; cada usuário vê apenas seus próprios dados.

- [ ] **Passo:** Tente editar ou remover uma disciplina/tarefa de outro usuário via API direta (usando ferramentas como Postman, simulando token da primeira conta para acessar dados da segunda).
  **Resultado esperado:** Acesso negado (erro 403 ou 404), devido a RLS.

## 5. Casos Negativos

- [ ] **Passo:** Tente criar uma disciplina sem token de autenticação (remova o token do header da requisição).
  **Resultado esperado:** Erro 401 (Unauthorized).

- [ ] **Passo:** Tente criar uma tarefa sem campos obrigatórios (ex.: título vazio).
  **Resultado esperado:** Erro 400 (Bad Request), com mensagem indicando campos obrigatórios.

- [ ] **Passo:** Tente editar uma disciplina inexistente (use um ID inválido).
  **Resultado esperado:** Erro 404 (Not Found).

- [ ] **Passo:** Tente remover uma tarefa inexistente.
  **Resultado esperado:** Erro 404 (Not Found).

- [ ] **Passo:** Tente listar disciplinas sem token.
  **Resultado esperado:** Erro 401 (Unauthorized).

- [ ] **Passo:** Tente criar uma disciplina com campos obrigatórios vazios.
  **Resultado esperado:** Erro 400 (Bad Request).