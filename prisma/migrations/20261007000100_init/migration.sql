CREATE TYPE "TodoStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
CREATE TYPE "TodoPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TABLE "Todo" (
  "id" UUID NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "status" "TodoStatus" NOT NULL DEFAULT 'PENDING',
  "priority" "TodoPriority" NOT NULL DEFAULT 'MEDIUM',
  "dueAt" TIMESTAMPTZ(3),
  "completedAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Todo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Todo_title_not_blank" CHECK (length(btrim("title")) > 0),
  CONSTRAINT "Todo_description_length" CHECK ("description" IS NULL OR length("description") <= 5000),
  CONSTRAINT "Todo_completion_consistent" CHECK (("status" = 'COMPLETED') = ("completedAt" IS NOT NULL))
);
CREATE INDEX "Todo_createdAt_id_idx" ON "Todo"("createdAt", "id");
CREATE INDEX "Todo_status_createdAt_id_idx" ON "Todo"("status", "createdAt", "id");
CREATE INDEX "Todo_priority_createdAt_id_idx" ON "Todo"("priority", "createdAt", "id");
CREATE INDEX "Todo_dueAt_id_idx" ON "Todo"("dueAt", "id");
