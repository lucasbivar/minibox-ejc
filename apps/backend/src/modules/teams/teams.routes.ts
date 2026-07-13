import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateBody } from "../../middleware/validate";
import { asyncHandler } from "../../shared/asyncHandler";
import { createTeamSchema } from "./teams.schema";
import { createTeam, deleteTeam, listTeams } from "./teams.service";

export const teamsRouter = Router();

teamsRouter.use(requireAuth);

teamsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const teams = await listTeams();
    res.json(teams);
  }),
);

teamsRouter.post(
  "/",
  validateBody(createTeamSchema),
  asyncHandler(async (req, res) => {
    const team = await createTeam(req.body);
    res.status(201).json(team);
  }),
);

teamsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteTeam(req.params.id);
    res.status(204).send();
  }),
);
