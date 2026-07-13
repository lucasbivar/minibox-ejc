import { Router } from "express";
import { requireAuth } from "../../middleware/auth";
import { validateBody, validateQuery } from "../../middleware/validate";
import { asyncHandler } from "../../shared/asyncHandler";
import { NotFoundError } from "../../shared/errors";
import { createSettlementSchema } from "../settlements/settlements.schema";
import {
  createSettlement,
  getOutstandingBalance,
  getParticipantFile,
} from "../settlements/settlements.service";
import {
  createParticipantSchema,
  listParticipantsQuerySchema,
  updateParticipantSchema,
  type ListParticipantsQuery,
} from "./participants.schema";
import {
  createParticipant,
  deleteParticipant,
  listParticipants,
  toParticipantDto,
  updateParticipant,
  getParticipantById,
} from "./participants.service";

export const participantsRouter = Router();

participantsRouter.use(requireAuth);

participantsRouter.get(
  "/",
  validateQuery(listParticipantsQuerySchema),
  asyncHandler(async (req, res) => {
    const query = req.query as unknown as ListParticipantsQuery;
    const participants = await listParticipants(query);
    res.json(participants);
  }),
);

participantsRouter.post(
  "/",
  validateBody(createParticipantSchema),
  asyncHandler(async (req, res) => {
    const participant = await createParticipant(req.body);
    res.status(201).json(participant);
  }),
);

participantsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const participant = await getParticipantById(req.params.id);
    if (participant.deletedAt) {
      throw new NotFoundError("Participante não encontrado.");
    }
    res.json(toParticipantDto(participant));
  }),
);

participantsRouter.patch(
  "/:id",
  validateBody(updateParticipantSchema),
  asyncHandler(async (req, res) => {
    const participant = await updateParticipant(req.params.id, req.body);
    res.json(participant);
  }),
);

participantsRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await deleteParticipant(req.params.id);
    res.status(204).send();
  }),
);

participantsRouter.get(
  "/:id/file",
  asyncHandler(async (req, res) => {
    const file = await getParticipantFile(req.params.id);
    res.json(file);
  }),
);

participantsRouter.get(
  "/:id/balance",
  asyncHandler(async (req, res) => {
    const outstandingBalance = await getOutstandingBalance(req.params.id);
    res.json({ outstandingBalance });
  }),
);

participantsRouter.post(
  "/:id/settlements",
  validateBody(createSettlementSchema),
  asyncHandler(async (req, res) => {
    const settlement = await createSettlement(req.params.id, req.body);
    res.status(201).json(settlement);
  }),
);
