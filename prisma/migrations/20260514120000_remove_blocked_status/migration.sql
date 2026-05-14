-- Remove o valor BLOCKED do enum TaskStatus.
-- Estratégia (Postgres não suporta DROP VALUE em enum):
--   1. Migra dados existentes (BLOCKED -> BACKLOG) em CreativeTask e StatusChange
--   2. Renomeia o enum antigo, cria o novo sem BLOCKED
--   3. Altera as colunas para o novo tipo via USING cast
--   4. Restaura o default da coluna status
--   5. Remove o enum antigo

-- 1. Mover dados de BLOCKED para BACKLOG
UPDATE "CreativeTask" SET "status" = 'BACKLOG' WHERE "status" = 'BLOCKED';
UPDATE "StatusChange" SET "fromStatus" = 'BACKLOG' WHERE "fromStatus" = 'BLOCKED';
UPDATE "StatusChange" SET "toStatus" = 'BACKLOG' WHERE "toStatus" = 'BLOCKED';

-- 2. Renomear o enum antigo
ALTER TYPE "TaskStatus" RENAME TO "TaskStatus_old";

-- 2. Criar o novo enum sem BLOCKED
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'BRIEFING', 'IN_PRODUCTION', 'IN_REVIEW', 'APPROVED', 'PUBLISHED');

-- 3. Dropar default temporariamente (o cast não funciona com default usando enum antigo)
ALTER TABLE "CreativeTask" ALTER COLUMN "status" DROP DEFAULT;

-- 3. Converter as colunas para o novo tipo
ALTER TABLE "CreativeTask"
  ALTER COLUMN "status" TYPE "TaskStatus" USING "status"::text::"TaskStatus";

ALTER TABLE "StatusChange"
  ALTER COLUMN "fromStatus" TYPE "TaskStatus" USING "fromStatus"::text::"TaskStatus";

ALTER TABLE "StatusChange"
  ALTER COLUMN "toStatus" TYPE "TaskStatus" USING "toStatus"::text::"TaskStatus";

-- 4. Restaurar default
ALTER TABLE "CreativeTask" ALTER COLUMN "status" SET DEFAULT 'BACKLOG';

-- 5. Remover o enum antigo
DROP TYPE "TaskStatus_old";
