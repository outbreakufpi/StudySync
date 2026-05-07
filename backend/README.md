# StudySync Backend (JavaScript)

Base do backend em Node + Express para a Sprint 8.

Como rodar

```bash
cd backend
npm install
# se backend/.env nao existir, crie-o uma unica vez com:
# cp .env.example .env
# depois, edite .env com sua URL e a anon key do Supabase
npm run dev
```

Observacoes:
- O backend agora usa Supabase direto para auth e persistencia.
- Se voce quiser rodar scripts SQL manuais, use o editor do Supabase e aplique a policy de insert em `public.profiles`.

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
