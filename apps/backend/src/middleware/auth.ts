import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../config/jwt";
import { UnauthorizedError } from "../shared/errors";
import { prisma } from "../shared/prisma";
import { asyncHandler } from "../shared/asyncHandler";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const requireAuth = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const header = req.header("authorization");
  if (!header || !header.startsWith("Bearer ")) {
    throw new UnauthorizedError("Autenticação necessária. Faça login novamente.");
  }

  const token = header.slice("Bearer ".length);

  let userId: string;
  try {
    userId = verifyAuthToken(token).userId;
  } catch {
    throw new UnauthorizedError("Sessão expirada ou inválida. Faça login novamente.");
  }

  const user = await prisma.systemUser.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) {
    throw new UnauthorizedError("Sessão inválida. Faça login novamente.");
  }

  req.userId = userId;
  next();
});
