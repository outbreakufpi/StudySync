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

Rotas stub disponíveis
- `GET /health`
- `GET /api/v1/auth/me`
- `GET /api/v1/subjects`
- `GET /api/v1/tasks`
- `GET /api/v1/sessions`

Próximos passos
- Aplicar as policies de RLS no Supabase
- Validar o fluxo completo de cadastro, login e CRUD com um usuario real
