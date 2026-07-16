import { Carousel } from "@mantine/carousel";
import { Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import type { BestSellingItemDto, RankingEntryDto, TeamConsumptionDto } from "@minibox/shared";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";
import type { ReactNode } from "react";
import { StatTile } from "../../components/StatTile";
import { formatCurrency, formatTime } from "../../lib/format";
import { PaymentMethodChart } from "./PaymentMethodChart";
import { RankingBarList } from "./RankingBarList";
import { SalesOverTimeChart } from "./SalesOverTimeChart";
import { TeamConsumptionChart } from "./TeamConsumptionChart";
import { useDashboardInsights, useDashboardSummary, useTopDebtors, useTopOrders, useTopPayers } from "./useDashboard";

const SLIDE_HEIGHT = "100%";
const AUTOPLAY_DELAY_MS = 5000;
const TOP_LIST_LIMIT = 5;

function Slide({ children }: { children: ReactNode }) {
  return (
    <Paper withBorder radius="md" p="lg" h={SLIDE_HEIGHT} style={{ overflow: "auto" }}>
      {children}
    </Paper>
  );
}

function teamsToRankingEntries(teams?: TeamConsumptionDto[]): RankingEntryDto[] {
  return (teams ?? []).map((team) => ({
    participantId: team.teamId,
    participantName: team.teamName,
    teamName: "",
    value: team.totalConsumed,
  }));
}

function productsToRankingEntries(items?: BestSellingItemDto[]): RankingEntryDto[] {
  return (items ?? []).slice(0, TOP_LIST_LIMIT).map((item) => ({
    participantId: item.menuItemId,
    participantName: item.description,
    teamName: "",
    value: item.quantitySold,
  }));
}

export function DashboardPage() {
  const summaryQuery = useDashboardSummary();
  const topDebtorsQuery = useTopDebtors();
  const topPayersQuery = useTopPayers();
  const topOrdersQuery = useTopOrders();
  const insightsQuery = useDashboardInsights();
  const autoplay = useRef(Autoplay({ delay: AUTOPLAY_DELAY_MS, stopOnMouseEnter: true, stopOnInteraction: false }));
  const { ref: carouselContainerRef, height: measuredHeight } = useElementSize();

  const lastUpdatedAt = summaryQuery.dataUpdatedAt;

  return (
    <Stack gap="md" style={{ flex: 1, minHeight: 0 }}>
      <Group justify="space-between" align="baseline" wrap="wrap">
        <div>
          <Title order={1}>Dashboard</Title>
          <Text c="dimmed">Saúde financeira e indicadores de consumo do Minibox.</Text>
        </div>
        {lastUpdatedAt > 0 && (
          <Text size="sm" c="dimmed">
            Última atualização: {formatTime(lastUpdatedAt)}
          </Text>
        )}
      </Group>

      <div ref={carouselContainerRef} style={{ flex: 1, minHeight: 0 }}>
      <Carousel
        withIndicators
        loop
        height={measuredHeight || 400}
        slideSize="100%"
        slideGap="md"
        controlsOffset="xs"
        plugins={[autoplay.current]}
      >
        <Carousel.Slide>
          <Slide>
            <Title order={2} mb="md">
              Totais gerais
            </Title>
            {summaryQuery.data && (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} mb="lg">
                <StatTile label="Total arrecadado" value={formatCurrency(summaryQuery.data.totalCollected)} tone="success" />
                <StatTile label="Total em aberto" value={formatCurrency(summaryQuery.data.totalOutstanding)} tone="danger" />
                <StatTile label="Ticket médio" value={formatCurrency(summaryQuery.data.averageTicket)} />
                <StatTile label="Nº de pedidos" value={String(summaryQuery.data.totalOrders)} />
              </SimpleGrid>
            )}

            <Divider mb="lg" />

            <TeamConsumptionChart teams={insightsQuery.data?.teamConsumption ?? []} />
          </Slide>
        </Carousel.Slide>

        <Carousel.Slide>
          <Slide>
            <Title order={2} mb="md">
              Resumo do encontro
            </Title>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              <RankingBarList
                title="Top 5 que mais compraram"
                entries={(insightsQuery.data?.topConsumers ?? []).slice(0, TOP_LIST_LIMIT)}
                hideValue
                emptyMessage="Nenhuma compra registrada ainda."
              />
              <RankingBarList
                title="Top 5 que estão devendo mais"
                entries={(topDebtorsQuery.data ?? []).slice(0, TOP_LIST_LIMIT)}
                hideValue
                emptyMessage="Nenhum participante com saldo em aberto."
              />
              <RankingBarList
                title="Top 5 produtos campeões de vendas"
                entries={productsToRankingEntries(insightsQuery.data?.bestSellingItemsByQuantity)}
                hideValue
                emptyMessage="Nenhuma venda registrada ainda."
              />
              <RankingBarList
                title="Top 5 equipes que mais consumiram"
                entries={teamsToRankingEntries(insightsQuery.data?.topConsumingTeams)}
                hideValue
                emptyMessage="Sem dados suficientes ainda."
              />
              <RankingBarList
                title="Top 5 equipes que menos consumiram"
                entries={teamsToRankingEntries(insightsQuery.data?.leastConsumingTeams)}
                hideValue
                emptyMessage="Sem dados suficientes ainda."
              />
            </SimpleGrid>
          </Slide>
        </Carousel.Slide>

        <Carousel.Slide>
          <Slide>
            <SimpleGrid cols={{ base: 1, md: 3 }} h="100%">
              <RankingBarList
                title="Top devedores"
                entries={topDebtorsQuery.data ?? []}
                formatValue={formatCurrency}
                emptyMessage="Nenhum participante com saldo em aberto."
              />
              <RankingBarList
                title="Top pagantes"
                entries={topPayersQuery.data ?? []}
                formatValue={formatCurrency}
                emptyMessage="Nenhum pagamento registrado ainda."
              />
              <RankingBarList
                title="Top pedidos"
                entries={topOrdersQuery.data ?? []}
                formatValue={(value) => `${value} pedido(s)`}
                emptyMessage="Nenhum pedido registrado ainda."
              />
            </SimpleGrid>
          </Slide>
        </Carousel.Slide>

        <Carousel.Slide>
          <Slide>
            <SimpleGrid cols={{ base: 1, md: 3 }} h="100%">
              <RankingBarList
                title="Maiores consumidores"
                entries={insightsQuery.data?.topConsumers ?? []}
                formatValue={formatCurrency}
              />
              <RankingBarList
                title="Maiores quitadores"
                entries={insightsQuery.data?.topSettlers ?? []}
                formatValue={formatCurrency}
              />
              <RankingBarList
                title='Devedores "zerados" (nada pago ainda)'
                entries={insightsQuery.data?.zeroedDebtors ?? []}
                formatValue={formatCurrency}
              />
            </SimpleGrid>
          </Slide>
        </Carousel.Slide>

        <Carousel.Slide>
          <Slide>
            <Title order={2} mb="md">
              Itens mais vendidos
            </Title>
            {insightsQuery.data?.championItem && (
              <Text mb="md">
                🏆 Item campeão do encontro: <strong>{insightsQuery.data.championItem.description}</strong> (
                {insightsQuery.data.championItem.quantitySold} unidades vendidas)
              </Text>
            )}
            <SimpleGrid cols={2}>
              <div>
                <Title order={3} mb="xs">
                  Por quantidade
                </Title>
                <Stack gap={4} component="ol" style={{ paddingLeft: "1.2rem" }}>
                  {insightsQuery.data?.bestSellingItemsByQuantity.map((item) => (
                    <li key={item.menuItemId}>
                      {item.description} — {item.quantitySold} un.
                    </li>
                  ))}
                </Stack>
              </div>
              <div>
                <Title order={3} mb="xs">
                  Por receita
                </Title>
                <Stack gap={4} component="ol" style={{ paddingLeft: "1.2rem" }}>
                  {insightsQuery.data?.bestSellingItemsByRevenue.map((item) => (
                    <li key={item.menuItemId}>
                      {item.description} — {formatCurrency(item.revenue)}
                    </li>
                  ))}
                </Stack>
              </div>
            </SimpleGrid>
          </Slide>
        </Carousel.Slide>

        <Carousel.Slide>
          <Slide>
            <Stack gap="lg">
              <PaymentMethodChart distribution={insightsQuery.data?.paymentMethodDistribution ?? []} />
              <div>
                <Title order={2} mb="sm">
                  Taxa de conversão fiado → pago
                </Title>
                <div style={{ height: 14, borderRadius: 999, backgroundColor: "var(--viz-sequential-track)" }}>
                  <div
                    style={{
                      width: `${(insightsQuery.data?.creditToPaidConversionRate ?? 0) * 100}%`,
                      height: "100%",
                      borderRadius: 999,
                      backgroundColor: "var(--viz-sequential)",
                    }}
                  />
                </div>
                <Text mt="xs">
                  {Math.round((insightsQuery.data?.creditToPaidConversionRate ?? 0) * 100)}% do total fiado já foi
                  quitado.
                </Text>
              </div>
            </Stack>
          </Slide>
        </Carousel.Slide>

        <Carousel.Slide>
          <Slide>
            <SalesOverTimeChart entries={insightsQuery.data?.salesByPeriod ?? []} />
          </Slide>
        </Carousel.Slide>
      </Carousel>
      </div>
    </Stack>
  );
}
