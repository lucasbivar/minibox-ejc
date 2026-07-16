import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import equipes from "./data/equipes.json";

const prisma = new PrismaClient();

const EXTRA_TEAMS_WITHOUT_MEMBERS = ["Visitante no Encontro"];

function normalizePhone(raw: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === "-") return null;
  if (/^\+(?!55)\d/.test(trimmed)) return null; // non-Brazilian country code

  const hasCountryCode = trimmed.startsWith("+55");
  const digits = trimmed.replace(/\D/g, "");
  const localDigits = hasCountryCode ? digits.slice(2) : digits;

  if (localDigits.length !== 10 && localDigits.length !== 11) return null;

  const ddd = localDigits.slice(0, 2);
  const local = localDigits.slice(2);
  const localFormatted =
    local.length === 9 ? `${local.slice(0, 5)}-${local.slice(5)}` : `${local.slice(0, 4)}-${local.slice(4)}`;

  return `+55 (${ddd}) ${localFormatted}`;
}

async function resetFakeData(): Promise<void> {
  await prisma.$executeRawUnsafe(
    "TRUNCATE TABLE order_items, orders, settlements, stock_adjustments, menu_items, participants, teams RESTART IDENTITY CASCADE;",
  );
}

async function seedTeamsAndParticipants(): Promise<{ teams: number; participants: number }> {
  let participantCount = 0;
  const teamNames = [...Object.keys(equipes as Record<string, [string, string | null][]>), ...EXTRA_TEAMS_WITHOUT_MEMBERS];

  for (const teamName of teamNames) {
    const team = await prisma.team.create({ data: { name: teamName } });
    const members = (equipes as Record<string, [string, string | null][]>)[teamName] ?? [];

    for (const [name, rawPhone] of members) {
      await prisma.participant.create({
        data: { name, teamId: team.id, phone: normalizePhone(rawPhone) },
      });
      participantCount += 1;
    }
  }

  return { teams: teamNames.length, participants: participantCount };
}

async function main(): Promise<void> {
  console.log("Limpando dados fictícios (participantes, pedidos, quitações, equipes, cardápio)...");
  await resetFakeData();

  console.log("Cadastrando equipes e membros do encontro...");
  const { teams, participants } = await seedTeamsAndParticipants();

  console.log(`Concluído: ${teams} equipes, ${participants} participantes cadastrados.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
