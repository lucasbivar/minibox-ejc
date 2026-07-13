import type { MenuItemDto, StockAlertsResponse } from "@minibox/shared";
import { apiClient } from "./client";

export interface CreateMenuItemInput {
  number: number;
  description: string;
  price: number;
  stock: number;
}

export interface UpdateMenuItemInput {
  number?: number;
  description?: string;
  price?: number;
}

export interface RestockMenuItemInput {
  quantityDelta: number;
  reason?: string;
}

export async function fetchMenuItems(): Promise<MenuItemDto[]> {
  const { data } = await apiClient.get<MenuItemDto[]>("/menu-items");
  return data;
}

export async function createMenuItem(input: CreateMenuItemInput): Promise<MenuItemDto> {
  const { data } = await apiClient.post<MenuItemDto>("/menu-items", input);
  return data;
}

export async function updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<MenuItemDto> {
  const { data } = await apiClient.patch<MenuItemDto>(`/menu-items/${id}`, input);
  return data;
}

export async function deleteMenuItem(id: string): Promise<void> {
  await apiClient.delete(`/menu-items/${id}`);
}

export async function setMenuItemAvailability(id: string, available: boolean): Promise<MenuItemDto> {
  const { data } = await apiClient.patch<MenuItemDto>(`/menu-items/${id}/availability`, { available });
  return data;
}

export async function restockMenuItem(id: string, input: RestockMenuItemInput): Promise<MenuItemDto> {
  const { data } = await apiClient.post<MenuItemDto>(`/menu-items/${id}/restock`, input);
  return data;
}

export async function fetchStockAlerts(): Promise<StockAlertsResponse> {
  const { data } = await apiClient.get<StockAlertsResponse>("/menu-items/alerts");
  return data;
}
