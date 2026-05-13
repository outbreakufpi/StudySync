# StudySync Backend API v1

## Base URL (local)
- `http://localhost:3001`

## Autenticação
- Todos os endpoints protegidos exigem cabeçalho HTTP:
  - `Authorization: Bearer <access_token>`
- O token é obtido pelo login via Supabase e enviado ao backend para validação.

---

## Endpoints

### Auth
Os endpoints de autenticação expõem criação de conta, login e consulta do perfil autenticado.

#### 1. POST `/api/v1/auth/signup`
- Cria um novo usuário.
- Body JSON:
  - `email` (string, obrigatório)
  - `password` (string, obrigatório)
  - campos adicionais opcionais são enviados como `user_metadata` para o Supabase

Respostas:
- `201 Created`
  - Retorna `{ user, message }`
- `400 Bad Request`
  - Erros de validação de email/senha ou falha de signup

Exemplo curl:
```bash
curl -X POST http://localhost:3001/api/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@exemplo.com","password":"Senha123","full_name":"Usuário Exemplo"}'
```

---

#### 2. POST `/api/v1/auth/login`
- Autentica o usuário e retorna sessão + perfil.
- Body JSON:
  - `email` (string, obrigatório)
  - `password` (string, obrigatório)

Respostas:
- `200 OK`
  - Retorna `{ user, session, profile, message }`
- `401 Unauthorized`
  - Falha de login

Exemplo curl:
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@exemplo.com","password":"Senha123"}'
```

---

#### 3. GET `/api/v1/auth/me`
- Retorna dados do usuário autenticado e perfil associado.
- Requer token Bearer.

Respostas:
- `200 OK`
  - Retorna `{ user, profile, valid: true }` ou dados do usuário autenticado
- `401 Unauthorized`
  - Token ausente, inválido ou expirado

Exemplo curl:
```bash
curl http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

---

## Subjects
Gerencia disciplinas do usuário.

#### 4. GET `/api/v1/subjects`
- Lista disciplinas do usuário autenticado.
- Query params:
  - `mode` (string, opcional) — filtra por modo (`university`, `competitive`, etc.)

Respostas:
- `200 OK`
  - Retorna `{ data: [subjects] }`
- `401 Unauthorized`
  - Token ausente ou inválido

Exemplo curl:
```bash
curl "http://localhost:3001/api/v1/subjects?mode=university" \
  -H "Authorization: Bearer <access_token>"
```

---

#### 5. POST `/api/v1/subjects`
- Cria uma nova disciplina para o usuário.
- Body JSON:
  - `name` (string)
  - `professor` (string, opcional)
  - `room` (string, opcional)
  - `color` (string, opcional)
  - `code` (string, opcional)
  - `mode` (string, opcional, padrão `university`)
  - `metadata` (objeto, opcional)

Respostas:
- `201 Created`
  - Retorna `{ data: subject }`
- `400 Bad Request`
  - Erros de validação ou payload inválido
- `401 Unauthorized`

Exemplo curl:
```bash
curl -X POST http://localhost:3001/api/v1/subjects \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Matemática","professor":"Prof. Silva","mode":"university"}'
```

---

#### 6. PATCH `/api/v1/subjects/:subjectId`
- Atualiza uma disciplina existente do usuário.
- Path params:
  - `subjectId` (string)
- Body JSON: quaisquer campos válidos do subject, como:
  - `name`, `professor`, `room`, `color`, `code`, `mode`, `metadata`, `is_active`

Respostas:
- `200 OK`
  - Retorna `{ data: updatedSubject }`
- `404 Not Found`
  - Se a disciplina não existir para o usuário
- `401 Unauthorized`

Exemplo curl:
```bash
curl -X PATCH http://localhost:3001/api/v1/subjects/123 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"color":"#00aaff","mode":"competitive"}'
```

---

#### 7. DELETE `/api/v1/subjects/:subjectId`
- Remove uma disciplina do usuário.
- Path params:
  - `subjectId` (string)

Respostas:
- `200 OK`
  - Retorna `{ data: { deleted: true } }`
- `401 Unauthorized`

Exemplo curl:
```bash
curl -X DELETE http://localhost:3001/api/v1/subjects/123 \
  -H "Authorization: Bearer <access_token>"
```

---

## Tasks
Gerencia tarefas do usuário.

#### 8. GET `/api/v1/tasks`
- Lista tarefas do usuário autenticado.
- Não requer query parameters específicos.
- Retorno inclui join com subject: `subject: { id, name }` quando disponível.

Respostas:
- `200 OK`
  - Retorna `{ data: [tasks] }`
- `401 Unauthorized`

Exemplo curl:
```bash
curl http://localhost:3001/api/v1/tasks \
  -H "Authorization: Bearer <access_token>"
```

---

#### 9. POST `/api/v1/tasks`
- Cria uma tarefa para o usuário.
- Body JSON:
  - `title` (string, obrigatório)
  - `due_date` (string ou date, obrigatório)
  - `subject_id` (string, opcional)
  - `description` (string, opcional)
  - `type` (string, opcional, padrão `task`)
  - `status` (string, opcional, padrão `todo`)
  - `priority` (integer, opcional)
  - `estimated_minutes` (number, opcional)
  - `recurrence` (string, opcional)
  - `tags` (array, opcional)
  - `metadata` (objeto, opcional)

Respostas:
- `201 Created`
  - Retorna `{ data: task }`
- `400 Bad Request`
  - Se `due_date` estiver ausente ou inválido
- `401 Unauthorized`

Exemplo curl:
```bash
curl -X POST http://localhost:3001/api/v1/tasks \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Estudar álgebra","due_date":"2026-05-15T10:00:00Z","subject_id":"abc123","priority":2}'
```

---

#### 10. PATCH `/api/v1/tasks/:taskId`
- Atualiza uma tarefa existente do usuário.
- Path params:
  - `taskId` (string)
- Body JSON: quaisquer campos aceitos pela tarefa.

Respostas:
- `200 OK`
  - Retorna `{ data: updatedTask }`
- `404 Not Found`
  - Se a tarefa não existir para o usuário
- `401 Unauthorized`

Exemplo curl:
```bash
curl -X PATCH http://localhost:3001/api/v1/tasks/456 \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"status":"done","priority":1}'
```

---

#### 11. DELETE `/api/v1/tasks/:taskId`
- Remove uma tarefa do usuário.
- Path params:
  - `taskId` (string)

Respostas:
- `200 OK`
  - Retorna `{ data: { deleted: true } }`
- `401 Unauthorized`

Exemplo curl:
```bash
curl -X DELETE http://localhost:3001/api/v1/tasks/456 \
  -H "Authorization: Bearer <access_token>"
```

---

## Sessions
Registra sessões de estudo do usuário.

#### 12. GET `/api/v1/sessions`
- Lista sessões de estudo do usuário autenticado.
- Não requer query parameters.

Respostas:
- `200 OK`
  - Retorna `{ data: [sessions] }`
- `401 Unauthorized`

Exemplo curl:
```bash
curl http://localhost:3001/api/v1/sessions \
  -H "Authorization: Bearer <access_token>"
```

---

#### 13. POST `/api/v1/sessions`
- Registra uma nova sessão de estudo.
- Body JSON:
  - `started_at` (string ou date, obrigatório)
  - `ended_at` (string ou date, obrigatório)
  - `subject_id` (string, opcional)
  - `questions_answered` (integer, opcional)
  - `depth` (string ou number, opcional)
  - `notes` (string, opcional)
  - `metadata` (objeto, opcional)

Respostas:
- `201 Created`
  - Retorna `{ data: session }`
- `400 Bad Request`
  - Se `started_at` ou `ended_at` estiverem ausentes ou inválidos
- `401 Unauthorized`

Exemplo curl:
```bash
curl -X POST http://localhost:3001/api/v1/sessions \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"started_at":"2026-05-13T08:00:00Z","ended_at":"2026-05-13T09:30:00Z","subject_id":"abc123","notes":"Sessão focada em revisão."}'
```

---

## Observações
- A relação `task → subject` é feita via `subject_id`, que é opcional.
- O retorno de listagem de tarefas inclui `subject: { id, name }` quando a tarefa está associada a uma disciplina.
