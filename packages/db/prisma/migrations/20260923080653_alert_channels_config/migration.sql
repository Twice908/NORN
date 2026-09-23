-- AlterTable
ALTER TABLE "Alert" ADD COLUMN     "channels" JSONB NOT NULL DEFAULT '{"email":{"enabled":false,"recipients":[]}}',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "enabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "name" TEXT NOT NULL DEFAULT 'Unnamed alert',
ADD COLUMN     "rule" JSONB NOT NULL DEFAULT '{"type":"run_failed","threshold":1,"window":"5m"}',
ADD COLUMN     "updatedAt" TIMESTAMP(3);

UPDATE "Alert"
SET "updatedAt" = CURRENT_TIMESTAMP
WHERE "updatedAt" IS NULL;

ALTER TABLE "Alert" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "AlertEvent" ADD COLUMN     "deliveredAt" TIMESTAMP(3),
ADD COLUMN     "error" TEXT,
ADD COLUMN     "payload" JSONB NOT NULL DEFAULT '{}',
ADD COLUMN     "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Alert_projectId_idx" ON "Alert"("projectId");

-- CreateIndex
CREATE INDEX "Alert_enabled_idx" ON "Alert"("enabled");
