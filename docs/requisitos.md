# Matriz de Requisitos da Sprint

- **Autenticação de usuário (login e registro)**
  - Status: feito
  - Como testar: Acesse `pages/login/index.html`, registre um usuário e faça login
  - Endpoints envolvidos: `POST /api/v1/auth/register`, `POST /api/v1/auth/login`
  - Bugs do frontend corrigidos!

- **CRUD de disciplinas**
  - Status: feito
  - Como testar: No modo universitário, crie, edite e exclua disciplinas
  - Endpoints envolvidos: `GET /api/v1/subjects`, `POST /api/v1/subjects`, `PUT /api/v1/subjects/:id`, `DELETE /api/v1/subjects/:id`
  - Bugs do frontend corrigidos!

- **CRUD de tarefas**
  - Status: feito
  - Como testar: Crie tarefas com prazo, marque como concluída e remova
  - Endpoints envolvidos: `GET /api/v1/tasks`, `POST /api/v1/tasks`, `PUT /api/v1/tasks/:id`, `DELETE /api/v1/tasks/:id`
  - Bugs do frontend corrigidos!

- **Dashboard universitário**
  - Status: feito
  - Como testar: No dashboard universitário, verifique disciplinas, tarefas e calendário
  - Endpoints envolvidos: `GET /api/v1/subjects`, `GET /api/v1/tasks`
  - Bugs do frontend corrigidos!

- **Registro de sessões de estudo no modo concurso**
  - Status: feito
  - Como testar: No dashboard concurso, registre sessão, horas e métricas
  - Endpoints envolvidos: `GET /api/v1/sessions`, `POST /api/v1/sessions`
  - Bugs do frontend corrigidos!

- **Perfil e configurações de usuário**
  - Status: feito
  - Como testar: Abra a página de perfil e configurações, verifique dados e logout
  - Endpoints envolvidos: `GET /api/v1/auth/me`, `POST /api/v1/auth/logout`
  - Bugs do frontend corrigidos!

- **Navegação entre modos universitário e concurso**
  - Status: feito
  - Como testar: Troque entre os dois modos na interface e confirme dados atualizados
  - Endpoints envolvidos: `GET /api/v1/subjects`, `GET /api/v1/sessions`
  - Bugs do frontend corrigidos!

- **Página de esqueci senha**
  - Status: feito
  - Como testar: Acesse `pages/forgot-password/index.html` e use o fluxo de recuperação
  - Bugs do frontend corrigidos!

- **Integração com Supabase e configuração CORS**
  - Status: feito
  - Como testar: Verifique `.env` e execute o backend, confirme chamadas de API

- **Serviço estático do frontend**
  - Status: feito
  - Como testar: Execute `npx --yes http-server . -p 5175` em `frontend` e abra `http://localhost:5175/pages/login/index.html`
