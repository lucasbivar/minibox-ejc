import { Paper, Stack, Text, Title } from "@mantine/core";
import type { RankingEntryDto } from "@minibox/shared";
import { motion } from "framer-motion";

interface RankingBarListProps {
  title: string;
  entries: RankingEntryDto[];
  formatValue?: (value: number) => string;
  hideValue?: boolean;
  emptyMessage?: string;
}

export function RankingBarList({ title, entries, formatValue, hideValue, emptyMessage }: RankingBarListProps) {
  const maxValue = Math.max(1, ...entries.map((entry) => entry.value));

  return (
    <Paper bg="gray.0" p="md" radius="md" h="100%" style={{ overflow: "auto" }}>
      <Title order={3} mb="sm">
        {title}
      </Title>
      {entries.length === 0 ? (
        <Text c="dimmed" size="sm">
          {emptyMessage ?? "Sem dados suficientes ainda."}
        </Text>
      ) : (
        <Stack gap="sm">
          {entries.map((entry, index) => (
            <motion.div
              key={entry.participantId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "0.2rem" }}>
                <span>
                  {entry.participantName}
                  {entry.teamName && (
                    <span style={{ color: "var(--mantine-color-dimmed)" }}> ({entry.teamName})</span>
                  )}
                </span>
                {!hideValue && <strong>{formatValue?.(entry.value)}</strong>}
              </div>
              <div
                style={{
                  height: 10,
                  borderRadius: 999,
                  backgroundColor: "var(--viz-sequential-track)",
                  overflow: "hidden",
                }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(entry.value / maxValue) * 100}%` }}
                  transition={{ duration: 0.5, delay: index * 0.03, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    backgroundColor: "var(--viz-sequential)",
                    borderRadius: 999,
                  }}
                />
              </div>
            </motion.div>
          ))}
        </Stack>
      )}
    </Paper>
  );
}
