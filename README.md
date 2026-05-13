# StudySync

StudySync é um painel de organização acadêmica para dois contextos:

- modo universitário, para disciplinas, tarefas e prazos
- modo concurso, para sessões de estudo, simulados e métricas de desempenho

## Como testar localmente

### 1. Pré-requisitos

- Node.js 18+ ou superior
- npm
- uma conta no Supabase com RLS configurado

### 2. Configurar o backend

Entre na pasta do backend e instale as dependências:

```bash
cd backend
npm install
```

Se você já tem `backend/.env` configurado, não rode nenhum comando de cópia.
Se ainda não existir, crie-o uma vez com:

```bash
cp .env.example .env
```

Depois preencha `backend/.env` com as variáveis abaixo:

```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
PORT=3001
CORS_ORIGIN=http://localhost:5175
FRONTEND_URL=http://localhost:5175
SUPABASE_SERVICE_ROLE_KEY=...
```

Variáveis do `backend/.env`:

- `PORT`: porta em que o backend Express será servido. O padrão sugerido é `3001`.
- `CORS_ORIGIN`: origem permitida para requisições do frontend. Normalmente `http://localhost:5175` durante o desenvolvimento.
- `FRONTEND_URL`: URL do frontend usada pelo backend para validações de CORS e redirecionamentos.
- `SUPABASE_URL`: URL do projeto Supabase. Encontre no painel do Supabase em Settings → API.
- `SUPABASE_ANON_KEY`: chave pública do Supabase para uso no frontend/backend. Encontre em Settings → API, seção `anon key`.
- `SUPABASE_SERVICE_ROLE_KEY`: chave de serviço privada do Supabase com permissões administrativas. Use apenas no backend e mantenha confidencial. É necessária apenas para operações administrativas e scripts de seed.

Observações:

- O fluxo principal usa Supabase direto para auth e persistência.
- `DATABASE_URL` e `DIRECT_URL` podem ficar vazios se você não for usar scripts externos.
- A tabela `public.profiles` precisa da policy de insert para o próprio usuário, definida em [frontend/docs/supabase-schema-sprint-08.sql](frontend/docs/supabase-schema-sprint-08.sql).

Depois suba o backend:

```bash
npm run dev
```

Se a porta `3001` já estiver ocupada, reutilize a instância que já está rodando ou libere o processo antigo.

### 3. Servir o frontend estático

Em outro terminal:

```bash
cd frontend
npx --yes http-server . -p 5175
```

Se a porta `5175` já estiver ocupada, use a aba já aberta do navegador ou escolha outra porta livre.

### 4. Abrir no navegador

Abra:

- `http://localhost:5175/pages/login/index.html`

Fluxo sugerido de teste:

1. Criar conta ou entrar com um usuário existente.
2. Escolher o modo universitário.
3. Criar uma disciplina.
4. Criar uma tarefa com prazo.
5. Marcar a tarefa como feita e conferir o resumo de crescimento.
6. Apagar a disciplina e confirmar que a tarefa continua no histórico como “Sem disciplina”.
7. Trocar para o modo concurso.
8. Registrar uma sessão de estudo e conferir horas, questões, simulados e sessões recentes.
9. Abrir Perfil e Configurações para validar dados do usuário e logout.

### Troubleshooting rápido

- Erro `401 Unauthorized`: verifique se o token de acesso está presente em `localStorage` e se o backend está rodando em `http://localhost:3001`. Se estiver usando múltiplas abas, faça logout e login novamente.
- Problemas de CORS: confirme se `CORS_ORIGIN` e `FRONTEND_URL` em `backend/.env` estão configurados para a URL exata do frontend, por exemplo `http://localhost:5175`.
- Porta ocupada `3001` ou `5175`: feche processos antigos ou escolha outra porta livre e atualize `backend/.env` e o comando do `http-server`.

## O que já está coberto

- login, registro e troca de modo
- dashboards responsivos nos dois ambientes
- CRUD de disciplinas e tarefas
- calendário e resumo de crescimento no modo universitário
- registro de sessão e métricas no modo concurso
- perfil, configurações e logout visível

## Estrutura principal

- `backend/` - API Node + Express
- `frontend/` - páginas estáticas e scripts da interface

## Guia rápido

Se alguém quiser testar sem abrir o projeto inteiro no editor, o caminho é este:

1. subir o backend
2. subir o frontend
3. abrir a página de login
4. criar conta ou entrar
5. navegar entre os dois modos e testar os fluxos acima
