import { Button, Group, Paper, Stack, Table, Tabs, Text, Title } from "@mantine/core";
import { DAY_PERIOD_HOURS, DAY_PERIOD_LABELS, DAY_PERIOD_ORDER } from "@minibox/shared";
import type { DayPeriod, SalesByHourEntryDto } from "@minibox/shared";
import { useEffect, useMemo, useState } from "react";
import { formatCurrency } from "../../lib/format";

const dayTabFormatter = new Intl.DateTimeFormat("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// O "dia do evento" começa às 6h — antes disso, ainda é considerado a madrugada do dia anterior.
function getCurrentEventDayKey(): string {
  const now = new Date();
  if (now.getHours() < 6) {
    const previousDay = new Date(now);
    previousDay.setDate(previousDay.getDate() - 1);
    return toDateKey(previousDay);
  }
  return toDateKey(now);
}

interface HourValue {
  totalAmount: number;
  orderCount: number;
}

interface DayBucket {
  day: string;
  hours: Record<DayPeriod, Record<number, HourValue>>;
}

function buildDayBuckets(entries: SalesByHourEntryDto[]): DayBucket[] {
  const byDay = new Map<string, DayBucket>();
  for (const entry of entries) {
    let bucket = byDay.get(entry.day);
    if (!bucket) {
      bucket = { day: entry.day, hours: { MANHA: {}, TARDE: {}, NOITE: {} } };
      byDay.set(entry.day, bucket);
    }
    bucket.hours[entry.period][entry.hour] = { totalAmount: entry.totalAmount, orderCount: entry.orderCount };
  }
  return [...byDay.values()].sort((a, b) => a.day.localeCompare(b.day));
}

function hourLabel(hour: number): string {
  return `${hour}h`;
}

export function SalesOverTimeChart({ entries }: { entries: SalesByHourEntryDto[] }) {
  const [showTable, setShowTable] = useState(false);
  const todayKey = getCurrentEventDayKey();
  const dayBuckets = useMemo(() => buildDayBuckets(entries), [entries]);

  const defaultDay = useMemo(() => {
    if (dayBuckets.some((bucket) => bucket.day === todayKey)) {
      return todayKey;
    }
    return dayBuckets[dayBuckets.length - 1]?.day ?? todayKey;
  }, [dayBuckets, todayKey]);

  const [selectedDay, setSelectedDay] = useState(defaultDay);

  useEffect(() => {
    setSelectedDay((current) => (dayBuckets.some((bucket) => bucket.day === current) ? current : defaultDay));
  }, [defaultDay, dayBuckets]);

  const activeBucket = dayBuckets.find((bucket) => bucket.day === selectedDay);

  const maxValue = activeBucket
    ? Math.max(
        1,
        ...DAY_PERIOD_ORDER.flatMap((period) =>
          DAY_PERIOD_HOURS[period].map((hour) => activeBucket.hours[period][hour]?.totalAmount ?? 0),
        ),
      )
    : 1;

  return (
    <div>
      <Group justify="space-between" mb="sm" wrap="wrap">
        <Title order={2} m={0}>
          Vendas ao longo do tempo
        </Title>
        <Button variant="default" size="xs" onClick={() => setShowTable((value) => !value)}>
          {showTable ? "Ver gráfico" : "Ver tabela"}
        </Button>
      </Group>

      {dayBuckets.length === 0 ? (
        <Text c="dimmed">Sem vendas registradas ainda.</Text>
      ) : (
        <>
          <Tabs value={selectedDay} onChange={(value) => value && setSelectedDay(value)} mb="md">
            <Tabs.List>
              {dayBuckets.map((bucket) => (
                <Tabs.Tab key={bucket.day} value={bucket.day}>
                  {dayTabFormatter.format(new Date(`${bucket.day}T12:00:00`))}
                  {bucket.day === todayKey ? " • Hoje" : ""}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs>

          {activeBucket &&
            (showTable ? (
              <Table verticalSpacing="xs">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Turno</Table.Th>
                    <Table.Th>Hora</Table.Th>
                    <Table.Th>Valor</Table.Th>
                    <Table.Th>Pedidos</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {DAY_PERIOD_ORDER.flatMap((period) =>
                    DAY_PERIOD_HOURS[period].map((hour) => {
                      const value = activeBucket.hours[period][hour] ?? { totalAmount: 0, orderCount: 0 };
                      return (
                        <Table.Tr key={`${period}-${hour}`}>
                          <Table.Td>{DAY_PERIOD_LABELS[period]}</Table.Td>
                          <Table.Td>{hourLabel(hour)}</Table.Td>
                          <Table.Td>{formatCurrency(value.totalAmount)}</Table.Td>
                          <Table.Td>{value.orderCount}</Table.Td>
                        </Table.Tr>
                      );
                    }),
                  )}
                </Table.Tbody>
              </Table>
            ) : (
              <Stack gap="lg">
                {DAY_PERIOD_ORDER.map((period) => (
                  <Paper key={period} withBorder radius="md" p="md">
                    <Title order={3} mb="sm">
                      {DAY_PERIOD_LABELS[period]}
                    </Title>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "flex-start",
                        gap: 10,
                        height: 140,
                      }}
                    >
                      {DAY_PERIOD_HOURS[period].map((hour) => {
                        const { totalAmount, orderCount } = activeBucket.hours[period][hour] ?? {
                          totalAmount: 0,
                          orderCount: 0,
                        };
                        return (
                          <div
                            key={hour}
                            title={`${hourLabel(hour)} — ${formatCurrency(totalAmount)} (${orderCount} pedido(s))`}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              flex: "1 0 auto",
                              minWidth: 24,
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                maxWidth: 32,
                                height: `${(totalAmount / maxValue) * 100}px`,
                                backgroundColor: "var(--viz-sequential)",
                                borderRadius: "4px 4px 0 0",
                              }}
                            />
                            <Text size="xs" c="dimmed" mt={4} style={{ whiteSpace: "nowrap" }}>
                              {hourLabel(hour)}
                            </Text>
                          </div>
                        );
                      })}
                    </div>
                  </Paper>
                ))}
              </Stack>
            ))}
        </>
      )}
    </div>
  );
}
