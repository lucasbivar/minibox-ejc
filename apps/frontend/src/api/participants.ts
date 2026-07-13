import type { PaginatedResponse, ParticipantDto, ParticipantFileDto } from "@minibox/shared";
import { apiClient } from "./client";

export interface CreateParticipantInput {
  name: string;
  teamId: string;
  phone?: string | null;
}

export interface UpdateParticipantInput {
  name?: string;
  teamId?: string;
  phone?: string | null;
}

export interface FetchParticipantsOptions {
  teamId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function fetchParticipants(
  options: FetchParticipantsOptions = {},
): Promise<PaginatedResponse<ParticipantDto>> {
  const { data } = await apiClient.get<PaginatedResponse<ParticipantDto>>("/participants", { params: options });
  return data;
}

export async function createParticipant(input: CreateParticipantInput): Promise<ParticipantDto> {
  const { data } = await apiClient.post<ParticipantDto>("/participants", input);
  return data;
}

export async function updateParticipant(id: string, input: UpdateParticipantInput): Promise<ParticipantDto> {
  const { data } = await apiClient.patch<ParticipantDto>(`/participants/${id}`, input);
  return data;
}

export async function deleteParticipant(id: string): Promise<void> {
  await apiClient.delete(`/participants/${id}`);
}

export async function fetchParticipantFile(id: string): Promise<ParticipantFileDto> {
  const { data } = await apiClient.get<ParticipantFileDto>(`/participants/${id}/file`);
  return data;
}

export async function createSettlement(
  participantId: string,
  input: { amount: number; paymentMethod: "CASH" | "PIX" | "CARD" },
): Promise<void> {
  await apiClient.post(`/participants/${participantId}/settlements`, input);
}
