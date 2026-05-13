# ADR 0001 — Stack inicial

**Status:** aceito
**Data:** 2026-05-12

## Contexto

Time pequeno de marketing/mídia de uma operação de e-commerce precisa organizar
demanda de criativos para anúncios e rastrear rupturas de estoque que pausam
campanhas. Não há sistema hoje — tudo passa por planilhas e Slack.

Decisões precisam favorecer **time-to-MVP** e custo operacional baixo, mantendo
caminho aberto para integrações futuras (Meta Ads, Shopify, etc.).

## Decisão

Stack: **Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Auth.js v5 (Google)
+ Prisma 7 + PostgreSQL (Supabase)**. Deploy em **Vercel**.

Pontos de design:

- **Auth.js v5 com JWT strategy + allowlist em tabela `User`**. Não usar `Account`/`Session`
  tables — não precisamos de OAuth-link entre múltiplos providers. Allowlist via env
  não escala; tabela permite admin gerenciar acesso sem redeploy.
- **`@prisma/adapter-pg`** (driver `pg` padrão) com **DATABASE_URL apontando para o
  Transaction pooler** (porta 6543, com `pgbouncer=true&connection_limit=1`) e
  **DIRECT_URL para conexão direta** (porta 5432) — esta é a que `prisma migrate`
  usa, porque pgbouncer em transaction mode não suporta os prepared statements
  que o migrate emite. Em Prisma 7 com o generator `prisma-client`, passar um
  driver adapter é obrigatório.
- **DnD do Kanban usa rota API dedicada (`PATCH /api/tasks/[id]/move`) + TanStack Query
  com atualização otimista**. Server Actions têm latência maior por dependerem do
  ciclo de revalidação; pra DnD isso vira UX travada.
- **`StatusChange` registrado a cada movimento** dentro de uma transação. Habilita
  métricas de lead time (Fase 2) sem refactor.
- **Server Components para leitura, Server Actions para CRUD via formulário, Route
  Handler para o caso quente do DnD.** Cada um na sua função.

## Alternativas consideradas

- **No-code (Notion/Airtable)**: descartado pelo usuário — quer codar e ter
  caminho para integrações.
- **Neon como Postgres provider**: foi a primeira escolha por causa do branching
  por PR. Trocamos para **Supabase** porque o usuário já tem familiaridade e
  porque Storage e Realtime nativos serão úteis em Fase 2/3 (anexos de criativo,
  Kanban multiusuário). Custo de troca foi 3 arquivos + 1 dependência.
- **Drizzle no lugar de Prisma**: Drizzle é melhor em edge runtime e migrations
  mais leves, mas Prisma 7 (com Studio + boa DX) é mais produtivo para um dev
  único nesse prazo.
- **Auth.js com adapter de banco + sessions no DB**: precisaria de Account/Session/
  VerificationToken — mais tabelas para validar nada que JWT já entrega no nosso caso.
- **Server Action no DnD**: descartado pelo motivo acima.

## Consequências

- Bus factor alto: 1 dev. Mitigado por ADRs, schema comentado e testes Playwright
  cobrindo os fluxos críticos (Fase 1).
- Migrar de JWT para DB sessions no futuro exige adicionar Auth.js Prisma Adapter
  e migration nova — mas estrutura atual não bloqueia.
- Trocar para edge runtime no futuro pede revisitar Prisma (Drizzle ou Prisma
  Accelerate). Não é problema agora.

## Próximos passos

- Fase 0 entregue: schema + skeleton de páginas + auth funcional.
- Fase 1 começa pelo DnD do Kanban com TanStack Query otimista e formulário de
  criação de task em modal (shadcn Dialog).
