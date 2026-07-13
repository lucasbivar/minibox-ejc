import { prisma } from "../shared/prisma";

const TABLES = [
  "order_items",
  "orders",
  "settlements",
  "stock_adjustments",
  "menu_items",
  "participants",
  "teams",
  "system_users",
];

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES.join(", ")} RESTART IDENTITY CASCADE;`);
}
