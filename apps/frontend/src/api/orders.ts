import type { CreateOrderInput, OrderDto, OrderStatus, PaginatedResponse, PaymentCondition } from "@minibox/shared";
import { apiClient } from "./client";

export interface FetchOrdersOptions {
  page?: number;
  pageSize?: number;
  teamId?: string;
  participantId?: string;
  search?: string;
  condition?: PaymentCondition;
  status?: OrderStatus;
}

export async function fetchOrders(options: FetchOrdersOptions = {}): Promise<PaginatedResponse<OrderDto>> {
  const { data } = await apiClient.get<PaginatedResponse<OrderDto>>("/orders", { params: options });
  return data;
}

export async function createOrder(input: CreateOrderInput): Promise<OrderDto> {
  const { data } = await apiClient.post<OrderDto>("/orders", input);
  return data;
}

export async function cancelOrder(id: string): Promise<OrderDto> {
  const { data } = await apiClient.post<OrderDto>(`/orders/${id}/cancel`);
  return data;
}
