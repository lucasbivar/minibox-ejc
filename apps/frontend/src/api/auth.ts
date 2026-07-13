import type { LoginInput, LoginResponse } from "@minibox/shared";
import { apiClient } from "./client";

export async function login(input: LoginInput): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", input);
  return data;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}
