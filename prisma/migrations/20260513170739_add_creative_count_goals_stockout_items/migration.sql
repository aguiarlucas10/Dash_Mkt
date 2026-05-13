-- CreateEnum
CREATE TYPE "StockoutItemStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterTable
ALTER TABLE "CreativeTask" ADD COLUMN     "creativeCount" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "month" DATE NOT NULL,
    "target" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockoutItem" (
    "id" TEXT NOT NULL,
    "product" TEXT NOT NULL,
    "category" TEXT,
    "status" "StockoutItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockoutItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Goal_month_key" ON "Goal"("month");

-- CreateIndex
CREATE INDEX "StockoutItem_status_idx" ON "StockoutItem"("status");
