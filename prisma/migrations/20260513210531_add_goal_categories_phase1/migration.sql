-- DropIndex
DROP INDEX "Goal_month_key";

-- AlterTable
ALTER TABLE "CreativeTask" ADD COLUMN     "goalCategoryId" TEXT;

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "categoryId" TEXT;

-- CreateTable
CREATE TABLE "GoalCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalCategory_name_key" ON "GoalCategory"("name");

-- AddForeignKey
ALTER TABLE "CreativeTask" ADD CONSTRAINT "CreativeTask_goalCategoryId_fkey" FOREIGN KEY ("goalCategoryId") REFERENCES "GoalCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "GoalCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
