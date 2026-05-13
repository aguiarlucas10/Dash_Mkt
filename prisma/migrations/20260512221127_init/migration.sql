-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "Tier" AS ENUM ('A', 'B', 'C');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('LAUNCH', 'PROMO', 'EVERGREEN', 'REPLACEMENT');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('P0', 'P1', 'P2', 'P3');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('BACKLOG', 'BRIEFING', 'IN_PRODUCTION', 'IN_REVIEW', 'APPROVED', 'PUBLISHED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('META', 'TIKTOK', 'GOOGLE', 'YOUTUBE');

-- CreateEnum
CREATE TYPE "AdStatus" AS ENUM ('ACTIVE', 'PAUSED');

-- CreateEnum
CREATE TYPE "PauseReason" AS ENUM ('STOCKOUT', 'LOW_PERFORMANCE', 'MANUAL', 'CREATIVE_REVIEW');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'EDITOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "margin" DECIMAL(6,4),
    "priorityTier" "Tier",
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreativeTask" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "TaskType" NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'P2',
    "deadline" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'BACKLOG',
    "platformTargets" "Platform"[],
    "assets" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,
    "requestedById" UUID NOT NULL,
    "assignedToId" UUID,

    CONSTRAINT "CreativeTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StatusChange" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "fromStatus" "TaskStatus",
    "toStatus" "TaskStatus" NOT NULL,
    "userId" UUID NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ad" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "status" "AdStatus" NOT NULL DEFAULT 'ACTIVE',
    "pauseReason" "PauseReason",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT,
    "stockoutId" TEXT,

    CONSTRAINT "Ad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdCreative" (
    "id" TEXT NOT NULL,
    "adId" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "AdCreative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockoutEvent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockoutEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Product_sku_key" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "CreativeTask_status_idx" ON "CreativeTask"("status");

-- CreateIndex
CREATE INDEX "CreativeTask_productId_idx" ON "CreativeTask"("productId");

-- CreateIndex
CREATE INDEX "CreativeTask_assignedToId_idx" ON "CreativeTask"("assignedToId");

-- CreateIndex
CREATE INDEX "CreativeTask_deadline_idx" ON "CreativeTask"("deadline");

-- CreateIndex
CREATE INDEX "StatusChange_taskId_idx" ON "StatusChange"("taskId");

-- CreateIndex
CREATE INDEX "StatusChange_at_idx" ON "StatusChange"("at");

-- CreateIndex
CREATE INDEX "Ad_status_idx" ON "Ad"("status");

-- CreateIndex
CREATE INDEX "Ad_productId_idx" ON "Ad"("productId");

-- CreateIndex
CREATE INDEX "Ad_stockoutId_idx" ON "Ad"("stockoutId");

-- CreateIndex
CREATE INDEX "AdCreative_adId_idx" ON "AdCreative"("adId");

-- CreateIndex
CREATE INDEX "AdCreative_taskId_idx" ON "AdCreative"("taskId");

-- CreateIndex
CREATE INDEX "StockoutEvent_productId_idx" ON "StockoutEvent"("productId");

-- CreateIndex
CREATE INDEX "StockoutEvent_endedAt_idx" ON "StockoutEvent"("endedAt");

-- AddForeignKey
ALTER TABLE "CreativeTask" ADD CONSTRAINT "CreativeTask_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeTask" ADD CONSTRAINT "CreativeTask_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreativeTask" ADD CONSTRAINT "CreativeTask_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CreativeTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StatusChange" ADD CONSTRAINT "StatusChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ad" ADD CONSTRAINT "Ad_stockoutId_fkey" FOREIGN KEY ("stockoutId") REFERENCES "StockoutEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_adId_fkey" FOREIGN KEY ("adId") REFERENCES "Ad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdCreative" ADD CONSTRAINT "AdCreative_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CreativeTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockoutEvent" ADD CONSTRAINT "StockoutEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
