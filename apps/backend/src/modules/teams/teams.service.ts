import type { Team } from "@prisma/client";
import type { TeamDto } from "@minibox/shared";
import { ConflictError, NotFoundError } from "../../shared/errors";
import { prisma } from "../../shared/prisma";
import type { CreateTeamInput } from "./teams.schema";

export function toTeamDto(team: Team): TeamDto {
  return {
    id: team.id,
    name: team.name,
    createdAt: team.createdAt.toISOString(),
  };
}

export async function listTeams(): Promise<TeamDto[]> {
  const teams = await prisma.team.findMany({ where: { deletedAt: null }, orderBy: { name: "asc" } });
  return teams.map(toTeamDto);
}

export async function createTeam(input: CreateTeamInput): Promise<TeamDto> {
  const existing = await prisma.team.findUnique({ where: { name: input.name } });
  if (existing) {
    throw new ConflictError("Já existe uma equipe cadastrada com este nome.");
  }

  const team = await prisma.team.create({ data: { name: input.name } });
  return toTeamDto(team);
}

export async function deleteTeam(id: string): Promise<void> {
  const team = await prisma.team.findUnique({ where: { id } });
  if (!team) {
    throw new NotFoundError("Equipe não encontrada.");
  }
  if (team.deletedAt) {
    throw new ConflictError("Esta equipe já foi excluída.");
  }

  const participantCount = await prisma.participant.count({ where: { teamId: id, deletedAt: null } });
  if (participantCount > 0) {
    throw new ConflictError(
      "Não é possível excluir uma equipe com participantes vinculados. Mova ou exclua os participantes primeiro.",
    );
  }

  await prisma.team.update({ where: { id }, data: { deletedAt: new Date() } });
}
