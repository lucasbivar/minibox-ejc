import { normalizeSearchText, OrderStatus, PaymentCondition, PaymentMethod } from "@minibox/shared";
import type {
  BestSellingItemDto,
  DashboardInsightsDto,
  DashboardSummaryDto,
  DayPeriod,
  DebtorDto,
  PaginatedResponse,
  PaymentMethodDistributionDto,
  RankingEntryDto,
  SalesByHourEntryDto,
} from "@minibox/shared";
import { roundCurrency, toNumber } from "../../shared/decimal";
import { prisma } from "../../shared/prisma";
import type { ListDebtorsQuerySchema } from "./dashboard.schema";
import { fetchParticipantFinancials } from "./financials";
import {
  getCreditToPaidConversionRate,
  getLeastConsumingTeams,
  getTeamConsumption,
  getTopConsumers,
  getTopConsumingTeams,
  getTopDebtors,
  getTopOrders,
  getTopPayers,
  getTopSettlers,
  getZeroedDebtors,
} from "./rankings";

const DEBTORS_DEFAULT_PAGE_SIZE = 20;
const DEBTORS_MAX_PAGE_SIZE = 100;

const BEST_SELLING_LIMIT = 10;
const TEAM_CONSUMPTION_RANKING_LIMIT = 5;

export async function getDashboardSummary(): Promise<DashboardSummaryDto> {
  const activeOrders = await prisma.order.aggregate({
    where: { status: OrderStatus.ACTIVE },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });

  const [immediateTotal, settlementsTotal, creditTotal] = await Promise.all([
    prisma.order.aggregate({
      where: { status: OrderStatus.ACTIVE, condition: PaymentCondition.IMMEDIATE },
      _sum: { totalAmount: true },
    }),
    prisma.settlement.aggregate({ _sum: { amount: true } }),
    prisma.order.aggregate({
      where: { status: OrderStatus.ACTIVE, condition: PaymentCondition.ON_CREDIT },
      _sum: { totalAmount: true },
    }),
  ]);

  const totalOrders = activeOrders._count._all;
  const totalOrdersAmount = toNumber(activeOrders._sum.totalAmount ?? 0);
  const totalCollected = roundCurrency(
    toNumber(immediateTotal._sum.totalAmount ?? 0) + toNumber(settlementsTotal._sum.amount ?? 0),
  );
  const totalOutstanding = roundCurrency(
    toNumber(creditTotal._sum.totalAmount ?? 0) - toNumber(settlementsTotal._sum.amount ?? 0),
  );
  const averageTicket = totalOrders > 0 ? roundCurrency(totalOrdersAmount / totalOrders) : 0;

  return { totalCollected, totalOutstanding, averageTicket, totalOrders };
}

export async function getTopDebtorsRanking(): Promise<RankingEntryDto[]> {
  return getTopDebtors(await fetchParticipantFinancials());
}

export async function getDebtors(query: ListDebtorsQuerySchema): Promise<PaginatedResponse<DebtorDto>> {
  const financials = await fetchParticipantFinancials();
  let debtors = financials.filter((financial) => financial.outstandingBalance > 0);

  if (query.teamId) {
    debtors = debtors.filter((financial) => financial.teamId === query.teamId);
  }
  if (query.search) {
    const term = normalizeSearchText(query.search);
    debtors = debtors.filter((financial) => normalizeSearchText(financial.participantName).includes(term));
  }

  const sortBy = query.sortBy ?? "value";
  const direction = query.sortDir === "asc" ? 1 : -1;
  debtors = [...debtors].sort((a, b) => {
    if (sortBy === "name") return direction * a.participantName.localeCompare(b.participantName);
    if (sortBy === "team") return direction * a.teamName.localeCompare(b.teamName);
    return direction * (a.outstandingBalance - b.outstandingBalance);
  });

  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(DEBTORS_MAX_PAGE_SIZE, Math.max(1, query.pageSize ?? DEBTORS_DEFAULT_PAGE_SIZE));
  const total = debtors.length;
  const items: DebtorDto[] = debtors.slice((page - 1) * pageSize, page * pageSize).map((financial) => ({
    participantId: financial.participantId,
    participantName: financial.participantName,
    teamId: financial.teamId,
    teamName: financial.teamName,
    phone: financial.phone,
    outstandingBalance: financial.outstandingBalance,
  }));

  return { items, total, page, pageSize };
}

export async function getTopPayersRanking(): Promise<RankingEntryDto[]> {
  return getTopPayers(await fetchParticipantFinancials());
}

export async function getTopOrdersRanking(): Promise<RankingEntryDto[]> {
  return getTopOrders(await fetchParticipantFinancials());
}

async function getBestSellingItems(): Promise<{ byQuantity: BestSellingItemDto[]; byRevenue: BestSellingItemDto[] }> {
  const aggregates = await prisma.orderItem.groupBy({
    by: ["menuItemId"],
    where: { order: { status: OrderStatus.ACTIVE } },
    _sum: { quantity: true, subtotal: true },
  });

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: aggregates.map((row) => row.menuItemId) } },
  });
  const descriptionById = new Map(menuItems.map((item) => [item.id, item.description]));

  const items: BestSellingItemDto[] = aggregates.map((row) => ({
    menuItemId: row.menuItemId,
    description: descriptionById.get(row.menuItemId) ?? "Item removido",
    quantitySold: row._sum.quantity ?? 0,
    revenue: toNumber(row._sum.subtotal ?? 0),
  }));

  const byQuantity = [...items].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, BEST_SELLING_LIMIT);
  const byRevenue = [...items].sort((a, b) => b.revenue - a.revenue).slice(0, BEST_SELLING_LIMIT);

  return { byQuantity, byRevenue };
}

async function getPaymentMethodDistribution(): Promise<PaymentMethodDistributionDto[]> {
  const aggregates = await prisma.order.groupBy({
    by: ["paymentMethod"],
    where: { status: OrderStatus.ACTIVE, condition: PaymentCondition.IMMEDIATE, paymentMethod: { not: null } },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });

  const totalsByMethod = new Map(
    aggregates.map((row) => [row.paymentMethod as PaymentMethod, { total: toNumber(row._sum.totalAmount ?? 0), count: row._count._all }]),
  );

  return (Object.values(PaymentMethod) as PaymentMethod[]).map((method) => ({
    method,
    totalAmount: totalsByMethod.get(method)?.total ?? 0,
    count: totalsByMethod.get(method)?.count ?? 0,
  }));
}

// O horário é armazenado em UTC; o evento acontece no fuso de Brasília (UTC-3, sem horário de verão).
const PERIOD_RANK: Record<DayPeriod, number> = { MANHA: 0, TARDE: 1, NOITE: 2 };

interface SalesByHourRow {
  event_day: Date;
  period: DayPeriod;
  hour: number;
  total_amount: string | null;
  order_count: bigint;
}

async function getSalesByPeriod(): Promise<SalesByHourEntryDto[]> {
  const rows = await prisma.$queryRaw<SalesByHourRow[]>`
    WITH local_orders AS (
      SELECT total_amount, (date_time - interval '3 hours') AS local_time
      FROM orders
      WHERE status = 'ACTIVE'
    )
    SELECT
      (CASE
         WHEN EXTRACT(HOUR FROM local_time) < 6 THEN (date_trunc('day', local_time) - interval '1 day')
         ELSE date_trunc('day', local_time)
       END)::date AS event_day,
      (CASE
         WHEN EXTRACT(HOUR FROM local_time) >= 6 AND EXTRACT(HOUR FROM local_time) < 12 THEN 'MANHA'
         WHEN EXTRACT(HOUR FROM local_time) >= 12 AND EXTRACT(HOUR FROM local_time) < 18 THEN 'TARDE'
         ELSE 'NOITE'
       END) AS period,
      EXTRACT(HOUR FROM local_time)::int AS hour,
      SUM(total_amount) AS total_amount,
      COUNT(*) AS order_count
    FROM local_orders
    GROUP BY event_day, period, hour
  `;

  return rows
    .map((row) => ({
      day: row.event_day.toISOString().slice(0, 10),
      period: row.period,
      hour: row.hour,
      totalAmount: toNumber(row.total_amount ?? 0),
      orderCount: Number(row.order_count),
    }))
    .sort((a, b) => a.day.localeCompare(b.day) || PERIOD_RANK[a.period] - PERIOD_RANK[b.period] || a.hour - b.hour);
}

export async function getDashboardInsights(): Promise<DashboardInsightsDto> {
  const financials = await fetchParticipantFinancials();

  const [allTeams, { byQuantity, byRevenue }, paymentMethodDistribution, salesByPeriod] = await Promise.all([
    prisma.team.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
    getBestSellingItems(),
    getPaymentMethodDistribution(),
    getSalesByPeriod(),
  ]);

  const teamConsumption = getTeamConsumption(financials);

  return {
    topConsumers: getTopConsumers(financials),
    bestSellingItemsByQuantity: byQuantity,
    bestSellingItemsByRevenue: byRevenue,
    championItem: byQuantity[0] ?? null,
    teamConsumption,
    topConsumingTeams: getTopConsumingTeams(teamConsumption, allTeams, TEAM_CONSUMPTION_RANKING_LIMIT),
    leastConsumingTeams: getLeastConsumingTeams(teamConsumption, allTeams, TEAM_CONSUMPTION_RANKING_LIMIT),
    paymentMethodDistribution,
    salesByPeriod,
    creditToPaidConversionRate: getCreditToPaidConversionRate(financials),
    zeroedDebtors: getZeroedDebtors(financials),
    topSettlers: getTopSettlers(financials),
  };
}
