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

Prisma (ORM)

```bash
cd backend
# ajuste DATABASE_URL e DIRECT_URL no .env
npm run prisma:generate
npm run prisma:test
```

Observacoes:
- `DATABASE_URL`: usar a URL com pooler (`:6543` e `?pgbouncer=true`) para queries da aplicacao.
- `DIRECT_URL`: usar a URL direta (`:5432`) para operacoes de schema/migracao.
- Sem `DATABASE_URL`, o backend continua com fallback para Supabase client em parte dos servicos.

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
