import type {
  DashboardInsightsDto,
  DashboardSummaryDto,
  DebtorDto,
  ListDebtorsQuery,
  PaginatedResponse,
  RankingEntryDto,
} from "@minibox/shared";
import { apiClient } from "./client";

export async function fetchDashboardSummary(): Promise<DashboardSummaryDto> {
  const { data } = await apiClient.get<DashboardSummaryDto>("/dashboard/summary");
  return data;
}

export async function fetchTopDebtors(): Promise<RankingEntryDto[]> {
  const { data } = await apiClient.get<RankingEntryDto[]>("/dashboard/top-debtors");
  return data;
}

export async function fetchTopPayers(): Promise<RankingEntryDto[]> {
  const { data } = await apiClient.get<RankingEntryDto[]>("/dashboard/top-payers");
  return data;
}

export async function fetchTopOrders(): Promise<RankingEntryDto[]> {
  const { data } = await apiClient.get<RankingEntryDto[]>("/dashboard/top-orders");
  return data;
}

export async function fetchDashboardInsights(): Promise<DashboardInsightsDto> {
  const { data } = await apiClient.get<DashboardInsightsDto>("/dashboard/insights");
  return data;
}

export async function fetchDebtors(query: ListDebtorsQuery): Promise<PaginatedResponse<DebtorDto>> {
  const { data } = await apiClient.get<PaginatedResponse<DebtorDto>>("/dashboard/debtors", { params: query });
  return data;
}
