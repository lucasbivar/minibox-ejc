import bcrypt from "bcrypt";
import { signAuthToken } from "../config/jwt";
import { prisma } from "../shared/prisma";

export async function createTestUser(overrides: { email?: string; password?: string; name?: string } = {}) {
  const password = overrides.password ?? "senha123";
  const passwordHash = await bcrypt.hash(password, 4);
  const user = await prisma.systemUser.create({
    data: {
      name: overrides.name ?? "Operador de Teste",
      email: overrides.email ?? `operador-${Date.now()}-${Math.random().toString(36).slice(2)}@minibox.local`,
      passwordHash,
    },
  });
  return { user, password };
}

export async function authHeaderFor(userId: string): Promise<string> {
  const token = signAuthToken({ userId });
  return `Bearer ${token}`;
}

export async function createAuthenticatedUser() {
  const { user } = await createTestUser();
  const authHeader = await authHeaderFor(user.id);
  return { user, authHeader };
}

export async function createTestTeam(overrides: { name?: string; deletedAt?: Date | null } = {}) {
  return prisma.team.create({
    data: {
      name: overrides.name ?? `Equipe ${Date.now()}-${Math.random().toString(36).slice(2)}`,
      deletedAt: overrides.deletedAt ?? null,
    },
  });
}

export async function createTestParticipant(
  overrides: { name?: string; teamId?: string; phone?: string | null; deletedAt?: Date | null } = {},
) {
  const teamId = overrides.teamId ?? (await createTestTeam()).id;
  return prisma.participant.create({
    data: {
      name: overrides.name ?? "Participante de Teste",
      teamId,
      phone: overrides.phone ?? null,
      deletedAt: overrides.deletedAt ?? null,
    },
  });
}

export async function createTestMenuItem(
  overrides: {
    number?: number;
    description?: string;
    price?: number;
    stock?: number;
    available?: boolean;
    deletedAt?: Date | null;
  } = {},
) {
  return prisma.menuItem.create({
    data: {
      number: overrides.number ?? Math.floor(Math.random() * 1_000_000),
      description: overrides.description ?? "Item de Teste",
      price: overrides.price ?? 5,
      stock: overrides.stock ?? 10,
      available: overrides.available ?? true,
      deletedAt: overrides.deletedAt ?? null,
    },
  });
}
