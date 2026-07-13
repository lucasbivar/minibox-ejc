-- AlterTable
ALTER TABLE "teams" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "participants" ADD COLUMN "deleted_at" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN "deleted_at" TIMESTAMP(3);
