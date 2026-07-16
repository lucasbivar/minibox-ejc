-- AlterTable
ALTER TABLE "menu_items"
  ADD COLUMN "warning_threshold" INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN "critical_threshold" INTEGER NOT NULL DEFAULT 0;
