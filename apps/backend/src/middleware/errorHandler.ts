import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../shared/errors";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (error instanceof ZodError) {
    const message = error.issues[0]?.message ?? "Dados inválidos.";
    res.status(400).json({ message });
    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({ message: error.message });
    return;
  }

  // eslint-disable-next-line no-console
  console.error(error);
  res.status(500).json({ message: "Erro interno no servidor. Tente novamente." });
}
