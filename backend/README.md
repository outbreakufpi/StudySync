# StudySync Backend (JavaScript)

Base do backend em Node + Express para a Sprint 8.

Como rodar

```bash
cd backend
npm install
cp .env.example .env
# editar .env com sua URL e keys do Supabase
npm run dev
```

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
- `GET /api/v1/subjects`
- `GET /api/v1/tasks`
- `GET /api/v1/sessions`

Próximos passos
- Implementar autenticação com Supabase
- Conectar controllers aos serviços que usam `supabaseClient`
