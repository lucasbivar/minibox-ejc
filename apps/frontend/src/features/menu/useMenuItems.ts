import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createMenuItem,
  deleteMenuItem,
  fetchMenuItems,
  restockMenuItem,
  setMenuItemAvailability,
  updateMenuItem,
  type CreateMenuItemInput,
  type RestockMenuItemInput,
  type UpdateMenuItemInput,
} from "../../api/menuItems";

const MENU_ITEMS_QUERY_KEY = "menu-items";
const STOCK_ALERTS_QUERY_KEY = "stock-alerts";

export function useMenuItemsQuery() {
  return useQuery({
    queryKey: [MENU_ITEMS_QUERY_KEY],
    queryFn: () => fetchMenuItems(),
  });
}

export function useMenuItemMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [MENU_ITEMS_QUERY_KEY] });
    queryClient.invalidateQueries({ queryKey: [STOCK_ALERTS_QUERY_KEY] });
  };

  const create = useMutation({
    mutationFn: (input: CreateMenuItemInput) => createMenuItem(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateMenuItemInput }) => updateMenuItem(id, input),
    onSuccess: invalidate,
  });

  const restock = useMutation({
    mutationFn: ({ id, input }: { id: string; input: RestockMenuItemInput }) => restockMenuItem(id, input),
    onSuccess: invalidate,
  });

  const setAvailability = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) => setMenuItemAvailability(id, available),
    onSuccess: invalidate,
  });

  const deleteItem = useMutation({
    mutationFn: (id: string) => deleteMenuItem(id),
    onSuccess: invalidate,
  });

  return { create, update, restock, setAvailability, deleteItem };
}
