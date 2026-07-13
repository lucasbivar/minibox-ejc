import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome da equipe."),
});

export type CreateTeamInput = z.infer<typeof createTeamSchema>;
