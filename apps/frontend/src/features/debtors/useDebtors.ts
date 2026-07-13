import { useQuery } from "@tanstack/react-query";
import type { ListDebtorsQuery } from "@minibox/shared";
import { fetchDebtors } from "../../api/dashboard";

const DEBTORS_QUERY_KEY = "debtors";

export function useDebtorsQuery(query: ListDebtorsQuery) {
  return useQuery({
    queryKey: [DEBTORS_QUERY_KEY, query],
    queryFn: () => fetchDebtors(query),
    placeholderData: (previousData) => previousData,
  });
}
