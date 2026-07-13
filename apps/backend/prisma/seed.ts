import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { CANONICAL_TEAM_NAMES } from "@minibox/shared";

const prisma = new PrismaClient();

async function seedTeams(): Promise<void> {
  for (const name of CANONICAL_TEAM_NAMES) {
    await prisma.team.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log(`Equipes cadastradas: ${CANONICAL_TEAM_NAMES.length}`);
}

async function seedAdminUser(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? "admin@minibox.local";
  const name = process.env.ADMIN_NAME ?? "Administrador";
  const password = process.env.ADMIN_PASSWORD ?? "minibox123";

  const existing = await prisma.systemUser.findUnique({ where: { email } });
  if (existing) {
    console.log(`Usuário admin já existe: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.systemUser.create({
    data: { name, email, passwordHash },
  });
  console.log(`Usuário admin criado: ${email}`);
}

async function main(): Promise<void> {
  await seedTeams();
  await seedAdminUser();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
