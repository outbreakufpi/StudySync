# Configuração do Supabase para StudySync

Este guia explica como obter as variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`, além de onde configurá-las no arquivo `backend/.env`.

## 1. Onde encontrar `SUPABASE_URL`

1. Acesse o painel do Supabase em https://app.supabase.com.
2. Abra o projeto correspondente ao StudySync.
3. No menu lateral, vá para `Settings` → `API`.
4. Copie o valor de `Project URL` ou `API URL`.
5. Esse valor deve ser usado como `SUPABASE_URL`.

## 2. Onde encontrar `SUPABASE_ANON_KEY`

1. Ainda na página `Settings` → `API`, localize a seção de chaves.
2. Copie a chave pública chamada `anon key`.
3. Essa chave é segura para uso no frontend e em chamadas públicas para o Supabase Auth e para queries que dependem de Row Level Security (RLS).
4. Use esse valor como `SUPABASE_ANON_KEY`.

## 3. Onde encontrar `SUPABASE_SERVICE_ROLE_KEY`

1. Na mesma página `Settings` → `API`, localize a chave `service_role key`.
2. Essa chave tem permissões administrativas completas no banco de dados Supabase.
3. Copie o valor de `service_role key`.
4. Use apenas no backend, nunca no frontend.

## 4. Onde configurar as variáveis no `.env`

Dentro da pasta `backend`, crie ou abra o arquivo `backend/.env`.

Adicione ou atualize as seguintes entradas:

```env
SUPABASE_URL=https://<seu-projeto>.supabase.co
SUPABASE_ANON_KEY=eyJ...anon...
SUPABASE_SERVICE_ROLE_KEY=eyJ...service_role...
PORT=3001
CORS_ORIGIN=http://localhost:5175
FRONTEND_URL=http://localhost:5175
```

### Importante
- `SUPABASE_URL` e `SUPABASE_ANON_KEY` podem ser usados pelo frontend no cliente Supabase.
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposto no frontend ou em código público.
- O backend usa `SUPABASE_SERVICE_ROLE_KEY` para operações administrativas e para assegurar a criação de perfis e dados com privilégios extras.

## 5. Aviso de segurança

**Nunca coloque `SUPABASE_SERVICE_ROLE_KEY` no frontend.**

- O `service_role` tem privilégios administrativos completos.
- Se vazado, um atacante pode ler, modificar ou excluir dados em todo o banco.
- Mantenha essa chave apenas em `backend/.env` e fora do controle de versão.

## 6. Recomendações

- Use `.env.example` como referência para as variáveis necessárias.
- Garanta que `backend/.env` esteja listado no `.gitignore`.
- Não copie `SUPABASE_SERVICE_ROLE_KEY` para arquivos públicos ou cliente web.
