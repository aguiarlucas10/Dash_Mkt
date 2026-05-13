# Dash Criativos

Dashboard interno para organizar a demanda de criativos de anúncios e o impacto
de rupturas de estoque sobre as campanhas ativas.

MVP focado em dois blocos: **Kanban de demandas de criativo** e **Painel de rupturas
e anúncios pausados**. Calendário e priorização automática chegam em fase posterior.

## Stack

- Next.js 16 (App Router, Turbopack default) + React 19
- TypeScript, Tailwind v4, shadcn/ui (base-ui)
- Auth.js v5 (Google) com allowlist na tabela `User`
- Prisma 7 + PostgreSQL (Supabase) via `@prisma/adapter-pg`
- TanStack Query (otimismo no DnD) + dnd-kit (Kanban)
- Zod para validação

## Setup

1. **Banco**: crie um projeto no [Supabase](https://supabase.com).
   - **Project Settings → Database → Connection string**:
     - `DATABASE_URL` = **Transaction pooler** (porta 6543), e adicione `?pgbouncer=true&connection_limit=1`
     - `DIRECT_URL` = **Session pooler ou Direct connection** (porta 5432) — usado pelo `prisma migrate`
2. **Google OAuth**: no [Google Cloud Console](https://console.cloud.google.com/apis/credentials),
   crie um OAuth 2.0 Client ID (Web).
   - Origens autorizadas: `http://localhost:3000`
   - Redirect URI: `http://localhost:3000/api/auth/callback/google`
3. **Variáveis**: copie `.env.example` para `.env` e preencha tudo.
   ```bash
   cp .env.example .env
   ```
4. **Instalar e gerar Prisma Client**:
   ```bash
   npm install            # também roda `prisma generate` via postinstall
   ```
5. **Aplicar migration inicial e seed**:
   ```bash
   npm run db:migrate -- --name init
   npm run db:seed
   ```
6. **Rodar**:
   ```bash
   npm run dev
   ```
   Abra http://localhost:3000.

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Next dev (Turbopack default) |
| `npm run build` | Build produção |
| `npm run db:generate` | Regenera o client Prisma |
| `npm run db:migrate` | Cria/aplica migrations em dev |
| `npm run db:migrate:deploy` | Aplica migrations em prod |
| `npm run db:seed` | Popular admin inicial + dados demo |
| `npm run db:studio` | Abre Prisma Studio |

## Allowlist

Quem entra na tabela `User` consegue logar via Google. Ninguém mais.
Para liberar um colega: na tela `/admin/users` (ou via Prisma Studio), insira
o e-mail dele com a role apropriada (`ADMIN`, `EDITOR`, `VIEWER`).

## Roadmap (resumo)

- **Fase 0** (atual): setup, schema, layout base, páginas skeleton, auth funcional
- **Fase 1**: DnD do Kanban, CRUD de tasks/produtos/anúncios, painel de rupturas completo
- **Fase 2**: calendário editorial, priorização por margem+prazo, métricas
- **Fase 3**: integrações Meta Ads / Shopify / Slack

Decisões arquiteturais em [`docs/adr/`](docs/adr/).
