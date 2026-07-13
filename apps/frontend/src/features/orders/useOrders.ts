import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cancelOrder, fetchOrders, type FetchOrdersOptions } from "../../api/orders";

const ORDERS_QUERY_KEY = "orders";

export function useOrdersQuery(filters: FetchOrdersOptions) {
  return useQuery({
    queryKey: [ORDERS_QUERY_KEY, filters],
    queryFn: () => fetchOrders(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORDERS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ["menu-items"] });
      queryClient.invalidateQueries({ queryKey: ["stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["participant-file"] });
    },
  });
}
