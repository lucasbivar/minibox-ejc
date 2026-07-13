import { DASHBOARD_POLLING_INTERVAL_MS } from "@minibox/shared";
import { useQuery } from "@tanstack/react-query";
import {
  fetchDashboardInsights,
  fetchDashboardSummary,
  fetchTopDebtors,
  fetchTopOrders,
  fetchTopPayers,
} from "../../api/dashboard";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: fetchDashboardSummary,
    refetchInterval: DASHBOARD_POLLING_INTERVAL_MS,
  });
}

export function useTopDebtors() {
  return useQuery({
    queryKey: ["dashboard-top-debtors"],
    queryFn: fetchTopDebtors,
    refetchInterval: DASHBOARD_POLLING_INTERVAL_MS,
  });
}

export function useTopPayers() {
  return useQuery({
    queryKey: ["dashboard-top-payers"],
    queryFn: fetchTopPayers,
    refetchInterval: DASHBOARD_POLLING_INTERVAL_MS,
  });
}

export function useTopOrders() {
  return useQuery({
    queryKey: ["dashboard-top-orders"],
    queryFn: fetchTopOrders,
    refetchInterval: DASHBOARD_POLLING_INTERVAL_MS,
  });
}

export function useDashboardInsights() {
  return useQuery({
    queryKey: ["dashboard-insights"],
    queryFn: fetchDashboardInsights,
    refetchInterval: DASHBOARD_POLLING_INTERVAL_MS,
  });
}
