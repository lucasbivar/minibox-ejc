import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  password: z.string().min(1, "Informe a senha."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const createSystemUserSchema = z.object({
  name: z.string().min(1, "Informe o nome do usuário."),
  email: z.string().min(1, "Informe o e-mail.").email("E-mail inválido."),
  password: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
});

export type CreateSystemUserInput = z.infer<typeof createSystemUserSchema>;
