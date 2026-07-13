import { DASHBOARD_POLLING_INTERVAL_MS } from "@minibox/shared";
import { useQuery } from "@tanstack/react-query";
import { fetchStockAlerts } from "../../api/menuItems";

export function useStockAlerts() {
  return useQuery({
    queryKey: ["stock-alerts"],
    queryFn: fetchStockAlerts,
    refetchInterval: DASHBOARD_POLLING_INTERVAL_MS,
  });
}
