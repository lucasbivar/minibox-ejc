import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";
import { CANONICAL_TEAM_NAMES, OrderStatus, PaymentCondition, PaymentMethod } from "@minibox/shared";

const prisma = new PrismaClient();

const FIRST_NAMES = [
  "Ana",
  "Bruno",
  "Carla",
  "Daniel",
  "Eduarda",
  "Felipe",
  "Gabriela",
  "Henrique",
  "Isabela",
  "João",
  "Karina",
  "Lucas",
  "Mariana",
  "Nathan",
  "Olívia",
  "Pedro",
  "Rafaela",
  "Samuel",
  "Tatiana",
  "Vitor",
  "Yasmin",
  "Rodrigo",
  "Camila",
  "Gustavo",
  "Beatriz",
  "Thiago",
  "Larissa",
  "Matheus",
  "Juliana",
  "André",
];

const LAST_NAMES = [
  "Silva",
  "Santos",
  "Oliveira",
  "Souza",
  "Pereira",
  "Costa",
  "Almeida",
  "Ferreira",
  "Rodrigues",
  "Carvalho",
  "Gomes",
  "Martins",
  "Araújo",
  "Barbosa",
  "Ribeiro",
  "Cardoso",
  "Nascimento",
  "Teixeira",
  "Moraes",
  "Correia",
];

const MENU_ITEMS = [
  { number: 1, description: "Coxinha", price: 6.0, stock: 80 },
  { number: 2, description: "Refrigerante Lata", price: 5.0, stock: 100 },
  { number: 3, description: "Água Mineral", price: 3.0, stock: 60 },
  { number: 4, description: "Salgado Misto", price: 7.0, stock: 40 },
  { number: 5, description: "Suco Natural", price: 6.5, stock: 30 },
  { number: 6, description: "Pastel", price: 8.0, stock: 25 },
  { number: 7, description: "Brigadeiro", price: 3.5, stock: 50 },
  { number: 8, description: "Pipoca Doce", price: 4.0, stock: 8 },
  { number: 9, description: "Cachorro-Quente", price: 9.0, stock: 15 },
  { number: 10, description: "Café", price: 3.0, stock: -5 },
  { number: 11, description: "Bolo Caseiro", price: 5.5, stock: 3 },
  { number: 12, description: "Chocolate", price: 4.5, stock: 0, available: false },
];

const PAYMENT_METHODS = [PaymentMethod.CASH, PaymentMethod.PIX, PaymentMethod.CARD];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(items: T[]): T {
  return items[randomInt(0, items.length - 1)];
}

function pickMany<T>(items: T[], count: number): T[] {
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, items.length));
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function randomPastDate(daysBack: number): Date {
  const now = Date.now();
  return new Date(now - randomInt(0, daysBack * 24 * 60 * 60 * 1000));
}

function randomPhone(): string {
  return `+55 ${randomInt(11, 99)} 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
}

async function resetFakeData(): Promise<void> {
  await prisma.$executeRawUnsafe(
    "TRUNCATE TABLE order_items, orders, settlements, stock_adjustments, menu_items, participants RESTART IDENTITY CASCADE;",
  );
}

async function seedTeams(): Promise<{ id: string; name: string }[]> {
  const teams = [];
  for (const name of CANONICAL_TEAM_NAMES) {
    teams.push(
      await prisma.team.upsert({
        where: { name },
        update: {},
        create: { name },
      }),
    );
  }
  return teams;
}

async function seedAdminUser(): Promise<string> {
  const email = process.env.ADMIN_EMAIL ?? "admin@minibox.local";
  const name = process.env.ADMIN_NAME ?? "Administrador";
  const password = process.env.ADMIN_PASSWORD ?? "minibox123";

  const existing = await prisma.systemUser.findUnique({ where: { email } });
  if (existing) {
    return existing.id;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const created = await prisma.systemUser.create({ data: { name, email, passwordHash } });
  return created.id;
}

async function seedMenuItems() {
  const items = [];
  for (const item of MENU_ITEMS) {
    items.push(await prisma.menuItem.create({ data: item }));
  }
  return items;
}

async function seedParticipants(teams: { id: string }[]) {
  const participants = [];
  for (const team of teams) {
    const count = randomInt(3, 6);
    for (let i = 0; i < count; i++) {
      const name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      const phone = Math.random() < 0.7 ? randomPhone() : null;
      participants.push(
        await prisma.participant.create({
          data: { name, teamId: team.id, phone },
        }),
      );
    }
  }
  return participants;
}

async function seedOrdersAndSettlements(
  participants: { id: string; teamId: string }[],
  menuItems: { id: string; price: unknown }[],
  operatorId: string,
): Promise<void> {
  for (const participant of participants) {
    const orderCount = Math.random() < 0.85 ? randomInt(1, 4) : 0;
    let totalOnCreditActive = 0;

    for (let i = 0; i < orderCount; i++) {
      const condition = Math.random() < 0.6 ? PaymentCondition.ON_CREDIT : PaymentCondition.IMMEDIATE;
      const paymentMethod = condition === PaymentCondition.IMMEDIATE ? pick(PAYMENT_METHODS) : null;
      const status = Math.random() < 0.08 ? OrderStatus.CANCELLED : OrderStatus.ACTIVE;
      const dateTime = randomPastDate(3);

      const chosenItems = pickMany(menuItems, randomInt(1, 3));
      let total = 0;
      const itemsData = chosenItems.map((item) => {
        const quantity = randomInt(1, 3);
        const unitPrice = Number(item.price);
        const subtotal = roundCurrency(unitPrice * quantity);
        total = roundCurrency(total + subtotal);
        return { menuItemId: item.id, quantity, unitPrice, subtotal, dateTime };
      });

      await prisma.order.create({
        data: {
          participantId: participant.id,
          teamId: participant.teamId,
          dateTime,
          condition,
          paymentMethod,
          totalAmount: total,
          status,
          operatorId,
          items: { create: itemsData },
        },
      });

      if (condition === PaymentCondition.ON_CREDIT && status === OrderStatus.ACTIVE) {
        totalOnCreditActive = roundCurrency(totalOnCreditActive + total);
      }
    }

    if (totalOnCreditActive > 0) {
      const outcome = Math.random();
      if (outcome < 0.3) {
        // "Devedor zerado" — has debt, never paid anything yet.
      } else if (outcome < 0.65) {
        const amount = roundCurrency(totalOnCreditActive * (0.3 + Math.random() * 0.4));
        await prisma.settlement.create({
          data: {
            participantId: participant.id,
            amount,
            paymentMethod: pick(PAYMENT_METHODS),
            dateTime: randomPastDate(2),
          },
        });
      } else {
        await prisma.settlement.create({
          data: {
            participantId: participant.id,
            amount: totalOnCreditActive,
            paymentMethod: pick(PAYMENT_METHODS),
            dateTime: randomPastDate(1),
          },
        });
      }
    }
  }
}

async function main(): Promise<void> {
  console.log("Limpando dados fictícios anteriores...");
  await resetFakeData();

  console.log("Cadastrando equipes...");
  const teams = await seedTeams();

  console.log("Garantindo usuário admin...");
  const operatorId = await seedAdminUser();

  console.log("Cadastrando itens do cardápio...");
  const menuItems = await seedMenuItems();

  console.log("Cadastrando participantes...");
  const participants = await seedParticipants(teams);

  console.log("Gerando pedidos e quitações...");
  await seedOrdersAndSettlements(participants, menuItems, operatorId);

  console.log(`Concluído: ${teams.length} equipes, ${menuItems.length} itens de cardápio, ${participants.length} participantes.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
