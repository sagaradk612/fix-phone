-- CreateEnum
CREATE TYPE "RepairStatus" AS ENUM ('REQUESTED', 'RECEIVED', 'DIAGNOSING', 'WAITING_APPROVAL', 'WAITING_PARTS', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'COMPLETED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "device" TEXT NOT NULL,
    "issue" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "preferredDate" TIMESTAMP(3),
    "notes" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en',
    "status" "RepairStatus" NOT NULL DEFAULT 'REQUESTED',
    "quotedPrice" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranslationCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "sourceLocale" TEXT NOT NULL,
    "targetLocale" TEXT NOT NULL,
    "sourceText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "contentVersion" TEXT NOT NULL DEFAULT 'v1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TranslationCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");

-- CreateIndex
CREATE INDEX "Booking_phone_reference_idx" ON "Booking"("phone", "reference");

-- CreateIndex
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "TranslationCache_cacheKey_key" ON "TranslationCache"("cacheKey");

-- CreateIndex
CREATE INDEX "TranslationCache_targetLocale_approved_idx" ON "TranslationCache"("targetLocale", "approved");
