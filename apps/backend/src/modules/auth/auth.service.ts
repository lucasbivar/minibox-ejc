import bcrypt from "bcrypt";
import type { LoginResponse, AuthUserDto } from "@minibox/shared";
import { signAuthToken } from "../../config/jwt";
import { UnauthorizedError, ConflictError } from "../../shared/errors";
import { prisma } from "../../shared/prisma";
import type { CreateSystemUserInput, LoginInput } from "./auth.schema";

const PASSWORD_HASH_ROUNDS = 10;

function toAuthUserDto(user: { id: string; name: string; email: string }): AuthUserDto {
  return { id: user.id, name: user.name, email: user.email };
}

export async function login(input: LoginInput): Promise<LoginResponse> {
  const user = await prisma.systemUser.findUnique({ where: { email: input.email } });
  if (!user) {
    throw new UnauthorizedError("E-mail ou senha incorretos.");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError("E-mail ou senha incorretos.");
  }

  const token = signAuthToken({ userId: user.id });
  return { token, user: toAuthUserDto(user) };
}

export async function createSystemUser(input: CreateSystemUserInput): Promise<AuthUserDto> {
  const existing = await prisma.systemUser.findUnique({ where: { email: input.email } });
  if (existing) {
    throw new ConflictError("Já existe um usuário cadastrado com este e-mail.");
  }

  const passwordHash = await bcrypt.hash(input.password, PASSWORD_HASH_ROUNDS);
  const user = await prisma.systemUser.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  return toAuthUserDto(user);
}
