# Arquitetura do StudySync

## Visão geral

O projeto StudySync é composto por dois blocos principais:
- `frontend/`: aplicação estática multipage construída com HTML, CSS e JavaScript.
- `backend/`: API em Node.js usando Express.

A autenticação e persistência de dados são gerenciadas pelo Supabase, que fornece Auth e DB.

## Frontend estático multipage

O frontend é distribuído como páginas estáticas organizadas em pastas dentro de `frontend/pages/`.
Cada rota corresponde a uma página HTML específica, por exemplo:
- `frontend/pages/login/index.html`
- `frontend/pages/registrar/index.html`
- `frontend/pages/perfil/index.html`

Os scripts JavaScript em `frontend/assets/js/` suportam a navegação, autenticação, perfil e outras interações.
O frontend consome a API do backend por meio de requisições HTTP e também usa o cliente Supabase para autenticação e operações locais.

## Backend Express

O backend está em `backend/src/` e é iniciado a partir de `backend/src/index.js`.
A aplicação Express define rotas e controladores para as funcionalidades principais do sistema.

Componentes principais:
- `backend/src/app.js`: configura a aplicação Express, middlewares e rotas.
- `backend/src/routes/`: define os endpoints da API.
- `backend/src/controllers/`: contém a lógica de cada recurso.
- `backend/src/services/`: abstrai a lógica de negócio e as interações com a base de dados.
- `backend/src/middlewares/`: lida com autenticação, erros e validação.

## Supabase (Auth + DB)

O Supabase é usado para:
- Autenticação de usuários (`Auth`)
- Banco de dados relacional (`DB`)

O backend se conecta ao Supabase por meio de `backend/src/config/supabaseClient.js`.
As credenciais e variáveis de ambiente estão isoladas em `backend/src/env.js`.

## Fluxo de token Bearer

O fluxo típico de autorização usa token do tipo Bearer:
1. Usuário faz login no frontend.
2. O Supabase emite um token de acesso JWT.
3. O frontend armazena esse token e o envia nas requisições ao backend no cabeçalho `Authorization: Bearer <token>`.
4. O middleware de autenticação (`backend/src/middlewares/authMiddleware.js`) valida o token e extrai o contexto do usuário.
5. O backend permite ou nega o acesso às rotas protegidas com base na validade do token.

## Pastas principais

- `frontend/`
  - `index.html`: ponto de entrada principal do frontend.
  - `assets/`: estilos e scripts estáticos.
  - `pages/`: páginas separadas para as diferentes seções da aplicação.

- `backend/`
  - `package.json`: dependências do backend.
  - `src/`: código-fonte da API.
  - `src/routes/`: definição de rotas e endpoints.
  - `src/controllers/`: lógica de controle de rotas.
  - `src/services/`: lógica de serviço e integração com o Supabase.
  - `src/middlewares/`: autenticação e tratamento de erros.
  - `src/config/`: configuração do cliente Supabase.

## Observações finais

A arquitetura segue um modelo simples e modular:
- frontend estático para experiência de usuário leve e rápida;
- backend Express para lógica de API e segurança;
- Supabase para autenticação e persistência de dados;
- comunicação segura com tokens Bearer entre frontend e backend.
