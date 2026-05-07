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
```

Observações:

- O fluxo principal agora usa Supabase direto para auth e persistência.
- `DATABASE_URL` e `DIRECT_URL` podem ficar vazios se você não for usar scripts externos.
- A tabela `public.profiles` precisa da policy de insert para o próprio usuário, definida em [frontend/docs/supabase-schema-sprint-08.sql](frontend/docs/supabase-schema-sprint-08.sql).

Depois suba o backend:

```bash
npm run dev
```

Se a porta `3001` já estiver ocupada, reutilize a instância que já está rodando ou libere o processo antigo.

### 3. Subir o frontend

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

