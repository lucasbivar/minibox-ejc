import type { TeamDto } from "@minibox/shared";
import { apiClient } from "./client";

export async function fetchTeams(): Promise<TeamDto[]> {
  const { data } = await apiClient.get<TeamDto[]>("/teams");
  return data;
}

export async function createTeam(name: string): Promise<TeamDto> {
  const { data } = await apiClient.post<TeamDto>("/teams", { name });
  return data;
}

export async function deleteTeam(id: string): Promise<void> {
  await apiClient.delete(`/teams/${id}`);
}
