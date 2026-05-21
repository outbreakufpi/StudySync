# API Examples

Este documento descreve as rotas existentes em `/api/v1/*` e inclui exemplos de `curl` com cabeçalhos e corpo JSON.

> Substitua `http://localhost:3000` pelo endereço correto do backend e `YOUR_ACCESS_TOKEN` pelo token de sessão válido.

## Autenticação: `/api/v1/auth`

### POST /api/v1/auth/signup
Cria um novo usuário.

```bash
curl -X POST http://localhost:3000/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaSegura123",
    "full_name": "Usuário Exemplo"
  }'
```

### POST /api/v1/auth/login
Autentica o usuário e retorna dados da sessão.

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com",
    "password": "SenhaSegura123"
  }'
```

### POST /api/v1/auth/logout
Encerra a sessão do usuário.

```bash
curl -X POST http://localhost:3000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### POST /api/v1/auth/reset-password
Solicita envio de e-mail para redefinição de senha.

```bash
curl -X POST http://localhost:3000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@example.com"
  }'
```

### GET /api/v1/auth/validate-session
Valida o token de sessão atual.

```bash
curl -X GET http://localhost:3000/api/v1/auth/validate-session \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### GET /api/v1/auth/me
Retorna informações do usuário autenticado.

```bash
curl -X GET http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### PATCH /api/v1/auth/me
Atualiza dados do perfil do usuário autenticado.

```bash
curl -X PATCH http://localhost:3000/api/v1/auth/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "current_mode": "competitive"
  }'
```

## Assuntos: `/api/v1/subjects`
Requer cabeçalho `Authorization: Bearer YOUR_ACCESS_TOKEN`.

### GET /api/v1/subjects
Lista os assuntos do usuário.

```bash
curl -X GET http://localhost:3000/api/v1/subjects \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### POST /api/v1/subjects
Cria um novo assunto.

```bash
curl -X POST http://localhost:3000/api/v1/subjects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Cálculo",
    "professor": "Prof. Silva",
    "code": "CAL101",
    "mode": "university"
  }'
```

### PATCH /api/v1/subjects/:subjectId
Atualiza um assunto existente.

```bash
curl -X PATCH http://localhost:3000/api/v1/subjects/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "name": "Cálculo Avançado"
  }'
```

### DELETE /api/v1/subjects/:subjectId
Remove um assunto do usuário.

```bash
curl -X DELETE http://localhost:3000/api/v1/subjects/123 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Tarefas: `/api/v1/tasks`
Requer cabeçalho `Authorization: Bearer YOUR_ACCESS_TOKEN`.

### GET /api/v1/tasks
Lista as tarefas do usuário.

```bash
curl -X GET http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### POST /api/v1/tasks
Cria uma nova tarefa.

```bash
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Estudar capítulos 1 e 2",
    "due_date": "2026-06-01T23:59:59.000Z",
    "subject_id": 456,
    "priority": 2
  }'
```

### PATCH /api/v1/tasks/:taskId
Atualiza uma tarefa existente.

```bash
curl -X PATCH http://localhost:3000/api/v1/tasks/789 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "status": "done"
  }'
```

### DELETE /api/v1/tasks/:taskId
Remove uma tarefa do usuário.

```bash
curl -X DELETE http://localhost:3000/api/v1/tasks/789 \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Sessões: `/api/v1/sessions`
Requer cabeçalho `Authorization: Bearer YOUR_ACCESS_TOKEN`.

### GET /api/v1/sessions
Lista as sessões de estudo do usuário.

```bash
curl -X GET http://localhost:3000/api/v1/sessions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### POST /api/v1/sessions
Cria uma nova sessão de estudo.

```bash
curl -X POST http://localhost:3000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "started_at": "2026-05-20T14:00:00.000Z",
    "ended_at": "2026-05-20T15:30:00.000Z",
    "subject_id": 456,
    "notes": "Revisão de álgebra",
    "questions_answered": 20
  }'
```
