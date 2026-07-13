import type { RankingEntryDto, TeamConsumptionDto } from "@minibox/shared";
import { roundCurrency } from "../../shared/decimal";
import type { ParticipantFinancial } from "./financials";

export const DEFAULT_RANKING_LIMIT = 10;

function toRankingEntry(financial: ParticipantFinancial, value: number): RankingEntryDto {
  return {
    participantId: financial.participantId,
    participantName: financial.participantName,
    teamName: financial.teamName,
    value,
  };
}

function topBy(
  financials: ParticipantFinancial[],
  valueOf: (financial: ParticipantFinancial) => number,
  limit: number,
): RankingEntryDto[] {
  return financials
    .map((financial) => ({ financial, value: valueOf(financial) }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((entry) => toRankingEntry(entry.financial, entry.value));
}

export function getTopDebtors(
  financials: ParticipantFinancial[],
  limit = DEFAULT_RANKING_LIMIT,
): RankingEntryDto[] {
  return topBy(financials, (f) => f.outstandingBalance, limit);
}

export function getTopPayers(
  financials: ParticipantFinancial[],
  limit = DEFAULT_RANKING_LIMIT,
): RankingEntryDto[] {
  return topBy(financials, (f) => f.totalPaid, limit);
}

export function getTopOrders(
  financials: ParticipantFinancial[],
  limit = DEFAULT_RANKING_LIMIT,
): RankingEntryDto[] {
  return topBy(financials, (f) => f.orderCount, limit);
}

export function getTopConsumers(
  financials: ParticipantFinancial[],
  limit = DEFAULT_RANKING_LIMIT,
): RankingEntryDto[] {
  return topBy(financials, (f) => f.totalConsumed, limit);
}

export function getTopSettlers(
  financials: ParticipantFinancial[],
  limit = DEFAULT_RANKING_LIMIT,
): RankingEntryDto[] {
  return topBy(financials, (f) => f.settled, limit);
}

export function getZeroedDebtors(
  financials: ParticipantFinancial[],
  limit = DEFAULT_RANKING_LIMIT,
): RankingEntryDto[] {
  return financials
    .filter((f) => f.outstandingBalance > 0 && f.settled === 0)
    .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
    .slice(0, limit)
    .map((f) => toRankingEntry(f, f.outstandingBalance));
}

export function getTeamConsumption(financials: ParticipantFinancial[]): TeamConsumptionDto[] {
  const byTeam = new Map<string, TeamConsumptionDto>();

  for (const financial of financials) {
    const current = byTeam.get(financial.teamId) ?? {
      teamId: financial.teamId,
      teamName: financial.teamName,
      totalConsumed: 0,
      totalOutstanding: 0,
    };
    current.totalConsumed = roundCurrency(current.totalConsumed + financial.totalConsumed);
    current.totalOutstanding = roundCurrency(current.totalOutstanding + financial.outstandingBalance);
    byTeam.set(financial.teamId, current);
  }

  return [...byTeam.values()].sort((a, b) => b.totalConsumed - a.totalConsumed);
}

export function getCreditToPaidConversionRate(financials: ParticipantFinancial[]): number {
  const totalOnCredit = financials.reduce((sum, f) => sum + f.onCredit, 0);
  const totalSettled = financials.reduce((sum, f) => sum + f.settled, 0);

  if (totalOnCredit <= 0) {
    return 0;
  }

  return roundCurrency(Math.min(1, Math.max(0, totalSettled / totalOnCredit)));
}
