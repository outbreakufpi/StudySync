# StudySync Backend (JavaScript)

Base do backend em Node + Express para a Sprint 8.

Como rodar

```bash
cd backend
npm install
# se backend/.env nao existir, crie-o uma unica vez com:
# cp .env.example .env
# depois, edite backend/.env com sua URL e a anon key do Supabase
npm run dev
```

Variáveis de ambiente em `backend/.env.example`:

- `PORT`: porta usada pelo backend Express. Use `3001` para desenvolvimento.
- `CORS_ORIGIN`: origem permitida das requisições do frontend. Exemplo: `http://localhost:5175`.
- `FRONTEND_URL`: URL do frontend para validações de CORS e possíveis redirecionamentos.
- `SUPABASE_URL`: URL do seu projeto Supabase. Está disponível em Settings → API do Supabase.
- `SUPABASE_ANON_KEY`: chave pública do Supabase para autenticação do frontend/backend. Está disponível em Settings → API, seção `anon key`.
- `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço privada do Supabase com permissões administrativas. Use somente no backend e mantenha-a confidencial. É necessária apenas para operações administrativas e scripts de seed.

Observações:
- O backend agora usa Supabase direto para auth e persistência.
- Se você quiser rodar scripts SQL manuais, use o editor do Supabase e aplique a policy de insert em `public.profiles`.

### Servir frontend estático

No diretório do frontend, execute:

```bash
cd ../frontend
npx --yes http-server . -p 5175
```

### Troubleshooting rápido

- `401 Unauthorized`: verifique se o backend está rodando em `http://localhost:3001`, se o token foi salvo em `localStorage` e se o frontend está chamando a API com o header `Authorization: Bearer <token>`.
- CORS bloqueado: confirme se `CORS_ORIGIN` e `FRONTEND_URL` correspondem exatamente à URL do frontend.
- Porta ocupada: se `3001` ou `5175` já estiverem em uso, escolha outra porta livre e atualize o comando de execução.

Principais arquivos
- `src/index.js` - entrypoint
- `src/app.js` - configura Express e middlewares
- `src/config/supabaseClient.js` - cliente Supabase
- `src/routes/` - rotas agrupadas
- `src/controllers/` - controllers por domínio
- `src/services/` - lógica de negócio
- `src/middlewares/` - middlewares (auth, error handler)

Documentação da API
- Swagger UI: `http://localhost:3001/api-docs`
- OpenAPI JSON: `http://localhost:3001/api/openapi.json`
- A documentação cobre as rotas `health`, `api`, `api/v1/auth`, `api/v1/subjects`, `api/v1/tasks` e `api/v1/sessions`.

Rotas stub disponíveis
- `GET /health`
- `GET /api/v1/auth/me`
- `GET /api/v1/subjects`
- `GET /api/v1/tasks`
- `GET /api/v1/sessions`

## Fluxos Principais

### 1. Fluxo de Autenticação e Profile Sync

Quando um usuário faz **signup** ou **login**, o sistema segue este fluxo:

```
Cliente (Frontend)
    ↓
    POST /api/v1/auth/signup ou /login
    ↓
    authController.signup() / login()
    ↓
    authService.signup() / login()
    ↓
    Supabase Auth (cria/valida usuário)
    ↓
    ensureProfile() → Sincroniza com tabela 'profiles'
    ├─ Busca por auth_uid (ID do usuário de auth)
    ├─ Se não encontrar, busca por email
    ├─ Se encontrar, atualiza auth_uid (vincula profile existente)
    └─ Se não encontrar, cria novo profile
    ↓
    Retorna user + profile + session
    ↓
    Cliente armazena token em localStorage
```

**Detalhes importantes:**
- O `ensureProfile()` garante que **sempre existe um profile** na tabela `profiles` para cada usuário autenticado
- Permite migrar usuários criados antes (já tinham profile) com a autenticação
- Sincroniza metadados: `full_name`, `avatar_url`, `current_mode`, `timezone`, `locale`

### 2. Fluxo de Validação de Sessão (Middleware)

Todas as rotas protegidas passam por `requireAuth()`:

```
Cliente (com token no header Authorization: Bearer <token>)
    ↓
    Qualquer rota protegida (ex: GET /api/v1/tasks)
    ↓
    authMiddleware.requireAuth()
    ├─ Extrai Bearer token do header
    ├─ Cria userClient com accessToken
    ├─ Valida token via Supabase Auth
    ├─ Carrega profile do usuário
    └─ Popula req.user com: { id, authUid, email, profile, client }
    ↓
    Controller processa a requisição
    ↓
    Service acessa dados usando client autenticado
    ↓
    Retorna resposta
```

**Estrutura de `req.user`:**
```javascript
{
  id: 'uuid-da-profile',           // ID do profile (chave primária)
  authUid: 'uuid-do-auth-user',    // ID do usuário de auth
  email: 'user@example.com',
  profile: { /* objeto completo do profile */ },
  client: SupabaseClient           // Cliente Supabase autenticado
}
```

### 3. Fluxo de Login com Metadata

Ao fazer login, o sistema registra informações de acesso:

```
authService.login()
    ↓
    Autentica no Supabase Auth
    ↓
    recordLoginMetadata()
    ├─ Incrementa metadata.login_count
    ├─ Define metadata.last_login_at
    └─ Atualiza updated_at no profile
    ↓
    Retorna user com profile atualizado
```

**Metadados gravados:**
- `login_count`: número total de logins
- `last_login_at`: ISO timestamp do último acesso

### 4. Fluxo de Alternância de Modo (University/Competitive)

Usuários podem alternar entre "modo universidade" e "modo competição":

```
Cliente
    ↓
    PATCH /api/v1/auth/me
    { "current_mode": "competitive" }
    ↓
    authController.updateMe()
    ↓
    authService.updateMe()
    ├─ Valida token
    ├─ Carrega profile atual
    ├─ Atualiza current_mode no profile
    ├─ Preserva metadados existentes
    └─ Retorna profile atualizado
    ↓
    Cliente recebe novo profile com current_mode
```

### 5. Fluxo de CRUD de Dados (Tasks, Subjects, Sessions)

Todas as operações de CRUD seguem este padrão:

```
Cliente (com token)
    ↓
    GET/POST/PATCH/DELETE /api/v1/{resource}
    ↓
    requireAuth() valida sessão (carrega req.user)
    ↓
    resourceController.action()
    ├─ Extrai req.user.id (profile ID do usuário logado)
    ├─ Extrai req.user.client (cliente autenticado)
    └─ Valida autorização se necessário
    ↓
    resourceService.operation(client, userId, ...)
    ├─ Executa query com RLS do Supabase
    │  (garante que o usuário só vê seus próprios dados)
    └─ Retorna dados filtrados automaticamente
    ↓
    Resposta com status apropriado
```

**Exemplos:**
- `listTasks()` → retorna apenas tasks do usuário logado
- `createTaskForUser()` → cria task associada ao user_id
- `updateTaskForUser()` → permite editar apenas próprias tasks (RLS)

## Estrutura de Dados (Simplificada)

```
Supabase Auth (tabela: auth.users)
├─ id (UUID)
├─ email
├─ encrypted_password
└─ user_metadata (JSON com full_name, avatar_url, etc)
    ↓ (1-para-1)
Database (tabela: public.profiles)
├─ id (PK, UUID do auth user)
├─ auth_uid (referência para auth.users.id)
├─ email
├─ full_name
├─ avatar_url
├─ current_mode ('university' | 'competitive')
├─ timezone
├─ locale
├─ metadata (JSON com login_count, last_login_at, etc)
└─ updated_at
    ↓ (1-para-muitos)
Dados do usuário
├─ tasks (task_id, user_id, title, due_date, ...)
├─ subjects (subject_id, user_id, name, ...)
└─ sessions (session_id, user_id, date, duration, ...)
```

## Fluxo de Erros

```
Requisição
    ↓
Erro ocorre em qualquer camada
    ↓
Capturado por try/catch
    ↓
next(err) → passa para errorHandler middleware
    ↓
errorHandler.js
├─ Formata mensagem de erro
├─ Define status HTTP apropriado
└─ Retorna JSON { error: "mensagem" }
    ↓
Cliente recebe erro estruturado
```

## Variáveis de Ambiente Necessárias

```env
# Supabase
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_ANON_KEY=sua-chave-anonima
SUPABASE_SERVICE_ROLE_KEY=sua-chave-service-role

# Express
PORT=3001
CORS_ORIGIN=http://localhost:5175
FRONTEND_URL=http://localhost:5175

# Node
NODE_ENV=development
```

**Notas:**
- `SUPABASE_ANON_KEY`: usada no cliente (browser), acesso público
- `SUPABASE_SERVICE_ROLE_KEY`: apenas no backend, acesso administrativo

Próximos passos
- Aplicar as policies de RLS no Supabase
- Validar o fluxo completo de cadastro, login e CRUD com um usuario real
