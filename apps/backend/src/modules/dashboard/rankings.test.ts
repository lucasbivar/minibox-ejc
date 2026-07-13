import { describe, expect, it } from "vitest";
import { buildParticipantFinancial } from "./financials";
import {
  getCreditToPaidConversionRate,
  getTeamConsumption,
  getTopConsumers,
  getTopDebtors,
  getTopOrders,
  getTopPayers,
  getTopSettlers,
  getZeroedDebtors,
} from "./rankings";

const ana = buildParticipantFinancial({
  participantId: "ana",
  participantName: "Ana",
  teamId: "t1",
  teamName: "Boa Vontade",
  phone: null,
  onCredit: 100,
  immediate: 20,
  settled: 40,
  orderCount: 3,
});

const bruno = buildParticipantFinancial({
  participantId: "bruno",
  participantName: "Bruno",
  teamId: "t1",
  teamName: "Boa Vontade",
  phone: null,
  onCredit: 30,
  immediate: 80,
  settled: 0,
  orderCount: 5,
});

const carla = buildParticipantFinancial({
  participantId: "carla",
  participantName: "Carla",
  teamId: "t2",
  teamName: "Ordem",
  phone: null,
  onCredit: 0,
  immediate: 0,
  settled: 0,
  orderCount: 0,
});

const financials = [ana, bruno, carla];

describe("getTopDebtors", () => {
  it("ordena por maior saldo devedor, do maior para o menor, ignorando quem não deve", () => {
    expect(getTopDebtors(financials)).toEqual([
      { participantId: "ana", participantName: "Ana", teamName: "Boa Vontade", value: 60 },
      { participantId: "bruno", participantName: "Bruno", teamName: "Boa Vontade", value: 30 },
    ]);
  });
});

describe("getTopPayers", () => {
  it("ordena por total pago (imediato + quitações), do maior para o menor", () => {
    expect(getTopPayers(financials)).toEqual([
      { participantId: "bruno", participantName: "Bruno", teamName: "Boa Vontade", value: 80 },
      { participantId: "ana", participantName: "Ana", teamName: "Boa Vontade", value: 60 },
    ]);
  });
});

describe("getTopOrders", () => {
  it("ordena por número de pedidos", () => {
    expect(getTopOrders(financials).map((e) => e.participantId)).toEqual(["bruno", "ana"]);
  });
});

describe("getTopConsumers", () => {
  it("ordena por consumo total (fiado + pago)", () => {
    expect(getTopConsumers(financials).map((e) => e.participantId)).toEqual(["ana", "bruno"]);
  });
});

describe("getTopSettlers", () => {
  it("ordena por total já quitado", () => {
    expect(getTopSettlers(financials)).toEqual([
      { participantId: "ana", participantName: "Ana", teamName: "Boa Vontade", value: 40 },
    ]);
  });
});

describe("getZeroedDebtors", () => {
  it("lista apenas devedores que ainda não pagaram nada", () => {
    expect(getZeroedDebtors(financials).map((e) => e.participantId)).toEqual(["bruno"]);
  });
});

describe("getTeamConsumption", () => {
  it("agrupa consumo e saldo em aberto por equipe", () => {
    const result = getTeamConsumption(financials);
    expect(result).toEqual([
      { teamId: "t1", teamName: "Boa Vontade", totalConsumed: 230, totalOutstanding: 90 },
      { teamId: "t2", teamName: "Ordem", totalConsumed: 0, totalOutstanding: 0 },
    ]);
  });
});

describe("getCreditToPaidConversionRate", () => {
  it("calcula a fração do total fiado que já foi quitada (arredondada a 2 casas)", () => {
    expect(getCreditToPaidConversionRate(financials)).toBe(0.31);
  });

  it("retorna 0 quando não há fiado registrado", () => {
    expect(getCreditToPaidConversionRate([carla])).toBe(0);
  });
});
