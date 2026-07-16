import type { Participant, Team } from "@prisma/client";
import { normalizeSearchText, type ParticipantDto, type PaginatedResponse } from "@minibox/shared";
import { ConflictError, NotFoundError } from "../../shared/errors";
import { prisma } from "../../shared/prisma";
import type {
  CreateParticipantInput,
  ListParticipantsQuery,
  UpdateParticipantInput,
} from "./participants.schema";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 200;

type ParticipantWithTeam = Participant & { team: Team };

export function toParticipantDto(participant: ParticipantWithTeam): ParticipantDto {
  return {
    id: participant.id,
    name: participant.name,
    phone: participant.phone,
    teamId: participant.teamId,
    teamName: participant.team.name,
    photoUrl: participant.photoUrl,
    createdAt: participant.createdAt.toISOString(),
  };
}

async function assertTeamExists(teamId: string): Promise<void> {
  const team = await prisma.team.findUnique({ where: { id: teamId } });
  if (!team) {
    throw new NotFoundError("Equipe não encontrada.");
  }
}

export async function listParticipants(
  query: ListParticipantsQuery,
): Promise<PaginatedResponse<ParticipantDto>> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));

  const where = {
    deletedAt: null,
    teamId: query.teamId,
  };

  let participants = await prisma.participant.findMany({
    where,
    include: { team: true },
    orderBy: { name: "asc" },
  });

  if (query.search) {
    const term = normalizeSearchText(query.search);
    participants = participants.filter((participant) => normalizeSearchText(participant.name).includes(term));
  }

  const total = participants.length;
  const paged = participants.slice((page - 1) * pageSize, page * pageSize);

  return { items: paged.map(toParticipantDto), total, page, pageSize };
}

export async function getParticipantById(id: string): Promise<ParticipantWithTeam> {
  const participant = await prisma.participant.findUnique({ where: { id }, include: { team: true } });
  if (!participant) {
    throw new NotFoundError("Participante não encontrado.");
  }
  return participant;
}

export async function createParticipant(input: CreateParticipantInput): Promise<ParticipantDto> {
  await assertTeamExists(input.teamId);

  const participant = await prisma.participant.create({
    data: {
      name: input.name,
      teamId: input.teamId,
      phone: input.phone ?? null,
    },
    include: { team: true },
  });

  return toParticipantDto(participant);
}

export async function deleteParticipant(id: string): Promise<void> {
  const participant = await getParticipantById(id);
  if (participant.deletedAt) {
    throw new ConflictError("Este participante já foi excluído.");
  }

  const [orderCount, settlementCount] = await Promise.all([
    prisma.order.count({ where: { participantId: id } }),
    prisma.settlement.count({ where: { participantId: id } }),
  ]);

  if (orderCount > 0 || settlementCount > 0) {
    throw new ConflictError(
      "Não é possível excluir um participante com pedidos ou quitações registrados.",
    );
  }

  await prisma.participant.update({ where: { id }, data: { deletedAt: new Date() } });
}

export async function updateParticipant(id: string, input: UpdateParticipantInput): Promise<ParticipantDto> {
  await getParticipantById(id);

  if (input.teamId !== undefined) {
    await assertTeamExists(input.teamId);
  }

  const participant = await prisma.participant.update({
    where: { id },
    data: {
      name: input.name,
      teamId: input.teamId,
      phone: input.phone,
    },
    include: { team: true },
  });

  return toParticipantDto(participant);
}
