import { Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import type { TeamConsumptionDto } from "@minibox/shared";
import { formatCurrency } from "../../lib/format";

export function TeamConsumptionChart({ teams }: { teams: TeamConsumptionDto[] }) {
  const maxValue = Math.max(1, ...teams.map((team) => Math.max(team.totalConsumed, team.totalOutstanding)));

  return (
    <>
      <Title order={2} mb="sm">
        Consumo por equipe
      </Title>

      <Group gap="lg" mb="md" style={{ fontSize: "0.85rem" }}>
        <Group gap={6}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "var(--viz-cat-1)", display: "inline-block" }} />
          Consumido
        </Group>
        <Group gap={6}>
          <span aria-hidden style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "var(--viz-cat-red)", display: "inline-block" }} />
          Em aberto
        </Group>
      </Group>

      {teams.length === 0 ? (
        <Text c="dimmed">Sem dados suficientes ainda.</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg" verticalSpacing="md">
          {teams.map((team) => (
            <div key={team.teamId}>
              <Text size="sm" fw={600} mb={4}>
                {team.teamName}
              </Text>
              <Stack gap={4}>
                <BarRow color="var(--viz-cat-1)" value={team.totalConsumed} maxValue={maxValue} />
                <BarRow color="var(--viz-cat-red)" value={team.totalOutstanding} maxValue={maxValue} />
              </Stack>
            </div>
          ))}
        </SimpleGrid>
      )}
    </>
  );
}

function BarRow({ color, value, maxValue }: { color: string; value: number; maxValue: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ flex: 1, height: 8, borderRadius: 999, backgroundColor: "var(--viz-sequential-track)" }}>
        <div style={{ width: `${(value / maxValue) * 100}%`, height: "100%", borderRadius: 999, backgroundColor: color }} />
      </div>
      <span style={{ fontSize: "0.78rem", minWidth: 90, textAlign: "right" }}>{formatCurrency(value)}</span>
    </div>
  );
}
