-- Tornar categoryId obrigatório agora que o backfill foi rodado e
-- adicionar unique constraint (categoryId, month).
ALTER TABLE "Goal" ALTER COLUMN "categoryId" SET NOT NULL;
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_categoryId_month_key" UNIQUE ("categoryId", "month");

-- Drop a FK antiga (era SET NULL com nullable) e recriar como Cascade
ALTER TABLE "Goal" DROP CONSTRAINT IF EXISTS "Goal_categoryId_fkey";
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "GoalCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
