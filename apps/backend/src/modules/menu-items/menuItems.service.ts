import type { MenuItem } from "@prisma/client";
import type { MenuItemDto, StockAlertsResponse } from "@minibox/shared";
import { ConflictError, NotFoundError, ValidationError } from "../../shared/errors";
import { toNumber } from "../../shared/decimal";
import { prisma } from "../../shared/prisma";
import type {
  CreateMenuItemInput,
  RestockMenuItemInput,
  SetMenuItemAvailabilityInput,
  UpdateMenuItemInput,
} from "./menuItems.schema";
import { computeStockSeverity } from "./stockSeverity";

export function toMenuItemDto(item: MenuItem): MenuItemDto {
  return {
    id: item.id,
    number: item.number,
    description: item.description,
    price: toNumber(item.price),
    stock: item.stock,
    warningThreshold: item.warningThreshold,
    criticalThreshold: item.criticalThreshold,
    severity: computeStockSeverity(item.stock, item.warningThreshold, item.criticalThreshold),
    available: item.available,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function listMenuItems(): Promise<MenuItemDto[]> {
  const items = await prisma.menuItem.findMany({
    where: { deletedAt: null },
    orderBy: { number: "asc" },
  });
  return items.map(toMenuItemDto);
}

async function assertNumberAvailable(number: number, ignoreId?: string): Promise<void> {
  const existing = await prisma.menuItem.findUnique({ where: { number } });
  if (existing && existing.id !== ignoreId) {
    throw new ConflictError("Já existe um item cadastrado com este número.");
  }
}

export async function createMenuItem(input: CreateMenuItemInput): Promise<MenuItemDto> {
  await assertNumberAvailable(input.number);

  const item = await prisma.menuItem.create({
    data: {
      number: input.number,
      description: input.description,
      price: input.price,
      stock: input.stock,
      warningThreshold: input.warningThreshold,
      criticalThreshold: input.criticalThreshold,
    },
  });

  return toMenuItemDto(item);
}

async function findMenuItemOrThrow(id: string): Promise<MenuItem> {
  const item = await prisma.menuItem.findUnique({ where: { id } });
  if (!item) {
    throw new NotFoundError("Item de cardápio não encontrado.");
  }
  return item;
}

export async function updateMenuItem(id: string, input: UpdateMenuItemInput): Promise<MenuItemDto> {
  const existing = await findMenuItemOrThrow(id);

  if (input.number !== undefined) {
    await assertNumberAvailable(input.number, id);
  }

  const warningThreshold = input.warningThreshold ?? existing.warningThreshold;
  const criticalThreshold = input.criticalThreshold ?? existing.criticalThreshold;
  if (criticalThreshold >= warningThreshold) {
    throw new ValidationError("O limite crítico (vermelho) deve ser menor que o limite de alerta (amarelo).");
  }

  const item = await prisma.menuItem.update({
    where: { id },
    data: {
      number: input.number,
      description: input.description,
      price: input.price,
      warningThreshold: input.warningThreshold,
      criticalThreshold: input.criticalThreshold,
    },
  });

  return toMenuItemDto(item);
}

export async function setMenuItemAvailability(
  id: string,
  input: SetMenuItemAvailabilityInput,
): Promise<MenuItemDto> {
  await findMenuItemOrThrow(id);
  const item = await prisma.menuItem.update({ where: { id }, data: { available: input.available } });
  return toMenuItemDto(item);
}

export async function deleteMenuItem(id: string): Promise<void> {
  const item = await findMenuItemOrThrow(id);
  if (item.deletedAt) {
    throw new ConflictError("Este item já foi excluído.");
  }

  await prisma.menuItem.update({
    where: { id },
    data: { deletedAt: new Date(), available: false },
  });
}

export async function restockMenuItem(id: string, input: RestockMenuItemInput): Promise<MenuItemDto> {
  await findMenuItemOrThrow(id);

  const item = await prisma.$transaction(async (tx) => {
    const updated = await tx.menuItem.update({
      where: { id },
      data: { stock: { increment: input.quantityDelta } },
    });
    await tx.stockAdjustment.create({
      data: { menuItemId: id, quantityDelta: input.quantityDelta, reason: input.reason },
    });
    return updated;
  });

  return toMenuItemDto(item);
}

export async function getStockAlerts(): Promise<StockAlertsResponse> {
  const items = await prisma.menuItem.findMany({
    where: { deletedAt: null },
    orderBy: { stock: "asc" },
  });

  const alertItems = items.map((item) => toMenuItemDto(item));

  const criticalCount = alertItems.filter((item) => item.severity === "critical").length;
  const warningCount = alertItems.filter((item) => item.severity === "warning").length;

  return { items: alertItems, criticalCount, warningCount };
}
