import type { MenuItem, Order, OrderItem, Participant, Prisma, Team } from "@prisma/client";
import { OrderStatus, PaymentCondition, type OrderDto, type PaginatedResponse } from "@minibox/shared";
import { ConflictError, NotFoundError } from "../../shared/errors";
import { roundCurrency, toNumber } from "../../shared/decimal";
import { prisma } from "../../shared/prisma";
import { getParticipantById } from "../participants/participants.service";
import type { CreateOrderInput, ListOrdersQuery } from "./orders.schema";

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type OrderWithRelations = Order & {
  participant: Participant;
  team: Team;
  items: (OrderItem & { menuItem: MenuItem })[];
};

export const ORDER_INCLUDE = {
  participant: true,
  team: true,
  items: { include: { menuItem: true } },
} as const;

export function toOrderDto(order: OrderWithRelations): OrderDto {
  return {
    id: order.id,
    participantId: order.participantId,
    participantName: order.participant.name,
    teamId: order.teamId,
    teamName: order.team.name,
    dateTime: order.dateTime.toISOString(),
    condition: order.condition,
    paymentMethod: order.paymentMethod,
    totalAmount: toNumber(order.totalAmount),
    status: order.status,
    items: order.items.map((item) => ({
      id: item.id,
      menuItemId: item.menuItemId,
      description: item.menuItem.description,
      quantity: item.quantity,
      unitPrice: toNumber(item.unitPrice),
      subtotal: toNumber(item.subtotal),
      dateTime: item.dateTime.toISOString(),
    })),
  };
}

export async function createOrder(input: CreateOrderInput, operatorId?: string): Promise<OrderDto> {
  const participant = await getParticipantById(input.participantId);
  if (participant.deletedAt) {
    throw new ConflictError("Este participante foi excluído e não pode registrar novos pedidos.");
  }

  const menuItemIds = [...new Set(input.items.map((item) => item.menuItemId))];
  const menuItems = await prisma.menuItem.findMany({ where: { id: { in: menuItemIds } } });
  const menuItemById = new Map(menuItems.map((item) => [item.id, item]));

  for (const requestedItem of input.items) {
    const menuItem = menuItemById.get(requestedItem.menuItemId);
    if (!menuItem) {
      throw new NotFoundError("Um ou mais itens do pedido não foram encontrados no cardápio.");
    }
    if (!menuItem.available) {
      throw new ConflictError(`O item "${menuItem.description}" está indisponível no momento.`);
    }
  }

  const preparedItems = input.items.map((requestedItem) => {
    const menuItem = menuItemById.get(requestedItem.menuItemId)!;
    const unitPrice = toNumber(menuItem.price);
    const subtotal = roundCurrency(unitPrice * requestedItem.quantity);
    return { menuItem, quantity: requestedItem.quantity, unitPrice, subtotal };
  });

  const totalAmount = roundCurrency(preparedItems.reduce((sum, item) => sum + item.subtotal, 0));

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        participantId: participant.id,
        teamId: participant.teamId,
        condition: input.condition,
        paymentMethod: input.condition === PaymentCondition.IMMEDIATE ? (input.paymentMethod ?? null) : null,
        totalAmount,
        operatorId,
        items: {
          create: preparedItems.map((item) => ({
            menuItemId: item.menuItem.id,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
          })),
        },
      },
      include: ORDER_INCLUDE,
    });

    for (const item of preparedItems) {
      await tx.menuItem.update({
        where: { id: item.menuItem.id },
        data: { stock: { decrement: item.quantity } },
      });
    }

    return created;
  });

  return toOrderDto(order);
}

export async function cancelOrder(orderId: string): Promise<OrderDto> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order) {
    throw new NotFoundError("Pedido não encontrado.");
  }
  if (order.status === OrderStatus.CANCELLED) {
    throw new ConflictError("Este pedido já foi cancelado.");
  }

  const cancelled = await prisma.$transaction(async (tx) => {
    for (const item of order.items) {
      await tx.menuItem.update({
        where: { id: item.menuItemId },
        data: { stock: { increment: item.quantity } },
      });
    }

    return tx.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: ORDER_INCLUDE,
    });
  });

  return toOrderDto(cancelled);
}

export async function getOrderById(orderId: string): Promise<OrderDto> {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: ORDER_INCLUDE });
  if (!order) {
    throw new NotFoundError("Pedido não encontrado.");
  }
  return toOrderDto(order);
}

export async function listOrders(query: ListOrdersQuery): Promise<PaginatedResponse<OrderDto>> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));

  const where: Prisma.OrderWhereInput = {
    teamId: query.teamId,
    participantId: query.participantId,
    condition: query.condition,
    status: query.status,
    participant: query.search ? { name: { contains: query.search, mode: "insensitive" } } : undefined,
  };

  const [total, orders] = await prisma.$transaction([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      include: ORDER_INCLUDE,
      orderBy: { dateTime: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  return { items: orders.map(toOrderDto), total, page, pageSize };
}

