import type { Settlement } from "@prisma/client";
import { OrderStatus, PaymentCondition, type ParticipantFileDto, type SettlementDto } from "@minibox/shared";
import { roundCurrency, toNumber } from "../../shared/decimal";
import { prisma } from "../../shared/prisma";
import { ORDER_INCLUDE, toOrderDto } from "../orders/orders.service";
import { getParticipantById, toParticipantDto } from "../participants/participants.service";
import { calculateOutstandingBalance } from "./balance";
import type { CreateSettlementInput } from "./settlements.schema";

export function toSettlementDto(settlement: Settlement): SettlementDto {
  return {
    id: settlement.id,
    participantId: settlement.participantId,
    amount: toNumber(settlement.amount),
    paymentMethod: settlement.paymentMethod,
    dateTime: settlement.dateTime.toISOString(),
  };
}

async function sumActiveOrdersAmount(participantId: string, condition?: PaymentCondition): Promise<number> {
  const result = await prisma.order.aggregate({
    where: { participantId, status: OrderStatus.ACTIVE, condition },
    _sum: { totalAmount: true },
  });
  return toNumber(result._sum.totalAmount ?? 0);
}

async function sumSettlements(participantId: string): Promise<number> {
  const result = await prisma.settlement.aggregate({
    where: { participantId },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount ?? 0);
}

export async function getOutstandingBalance(participantId: string): Promise<number> {
  const [totalOnCredit, totalSettled] = await Promise.all([
    sumActiveOrdersAmount(participantId, PaymentCondition.ON_CREDIT),
    sumSettlements(participantId),
  ]);
  return calculateOutstandingBalance(totalOnCredit, totalSettled);
}

export async function createSettlement(participantId: string, input: CreateSettlementInput): Promise<SettlementDto> {
  await getParticipantById(participantId);

  const settlement = await prisma.settlement.create({
    data: {
      participantId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
    },
  });

  return toSettlementDto(settlement);
}

export async function getParticipantFile(participantId: string): Promise<ParticipantFileDto> {
  const participant = await getParticipantById(participantId);

  const [orders, settlements, totalOnCreditActive, totalImmediateActive, totalSettled] = await Promise.all([
    prisma.order.findMany({
      where: { participantId },
      include: ORDER_INCLUDE,
      orderBy: { dateTime: "desc" },
    }),
    prisma.settlement.findMany({
      where: { participantId },
      orderBy: { dateTime: "desc" },
    }),
    sumActiveOrdersAmount(participantId, PaymentCondition.ON_CREDIT),
    sumActiveOrdersAmount(participantId, PaymentCondition.IMMEDIATE),
    sumSettlements(participantId),
  ]);

  const totalConsumed = roundCurrency(totalOnCreditActive + totalImmediateActive);
  const totalPaid = roundCurrency(totalImmediateActive + totalSettled);
  const outstandingBalance = calculateOutstandingBalance(totalOnCreditActive, totalSettled);

  return {
    participant: toParticipantDto(participant),
    totalConsumed,
    totalPaid,
    outstandingBalance,
    orders: orders.map(toOrderDto),
    settlements: settlements.map(toSettlementDto),
  };
}
