import { OrderStatus, PaymentCondition } from "@minibox/shared";
import { roundCurrency, toNumber } from "../../shared/decimal";
import { prisma } from "../../shared/prisma";
import { calculateOutstandingBalance } from "../settlements/balance";

export interface ParticipantFinancial {
  participantId: string;
  participantName: string;
  teamId: string;
  teamName: string;
  phone: string | null;
  onCredit: number;
  immediate: number;
  settled: number;
  orderCount: number;
  outstandingBalance: number;
  totalPaid: number;
  totalConsumed: number;
}

export function buildParticipantFinancial(raw: {
  participantId: string;
  participantName: string;
  teamId: string;
  teamName: string;
  phone: string | null;
  onCredit: number;
  immediate: number;
  settled: number;
  orderCount: number;
}): ParticipantFinancial {
  return {
    ...raw,
    outstandingBalance: calculateOutstandingBalance(raw.onCredit, raw.settled),
    totalPaid: roundCurrency(raw.immediate + raw.settled),
    totalConsumed: roundCurrency(raw.onCredit + raw.immediate),
  };
}

export async function fetchParticipantFinancials(): Promise<ParticipantFinancial[]> {
  const [creditSums, immediateSums, settlementSums, orderCounts, participants] = await Promise.all([
    prisma.order.groupBy({
      by: ["participantId"],
      where: { status: OrderStatus.ACTIVE, condition: PaymentCondition.ON_CREDIT },
      _sum: { totalAmount: true },
    }),
    prisma.order.groupBy({
      by: ["participantId"],
      where: { status: OrderStatus.ACTIVE, condition: PaymentCondition.IMMEDIATE },
      _sum: { totalAmount: true },
    }),
    prisma.settlement.groupBy({
      by: ["participantId"],
      _sum: { amount: true },
    }),
    prisma.order.groupBy({
      by: ["participantId"],
      where: { status: OrderStatus.ACTIVE },
      _count: { _all: true },
    }),
    prisma.participant.findMany({ where: { deletedAt: null }, include: { team: true } }),
  ]);

  const participantById = new Map(participants.map((participant) => [participant.id, participant]));
  const creditMap = new Map(creditSums.map((row) => [row.participantId, toNumber(row._sum.totalAmount ?? 0)]));
  const immediateMap = new Map(immediateSums.map((row) => [row.participantId, toNumber(row._sum.totalAmount ?? 0)]));
  const settledMap = new Map(settlementSums.map((row) => [row.participantId, toNumber(row._sum.amount ?? 0)]));
  const countMap = new Map(orderCounts.map((row) => [row.participantId, row._count._all]));

  const participantIds = new Set([
    ...creditMap.keys(),
    ...immediateMap.keys(),
    ...settledMap.keys(),
    ...countMap.keys(),
  ]);

  return [...participantIds]
    .filter((participantId) => participantById.has(participantId))
    .map((participantId) => {
      const participant = participantById.get(participantId)!;
      return buildParticipantFinancial({
        participantId,
        participantName: participant.name,
        teamId: participant.teamId,
        teamName: participant.team.name,
        phone: participant.phone,
        onCredit: creditMap.get(participantId) ?? 0,
        immediate: immediateMap.get(participantId) ?? 0,
        settled: settledMap.get(participantId) ?? 0,
        orderCount: countMap.get(participantId) ?? 0,
      });
    });
}
