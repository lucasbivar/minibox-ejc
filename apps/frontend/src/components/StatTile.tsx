import { Paper, Text } from "@mantine/core";
import { motion } from "framer-motion";

interface StatTileProps {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger";
}

export function StatTile({ label, value, tone = "neutral" }: StatTileProps) {
  const color = tone === "success" ? "green.7" : tone === "danger" ? "red.7" : undefined;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ flex: "1 1 180px" }}
    >
      <Paper withBorder radius="md" p="md">
        <Text size="sm" c="dimmed">
          {label}
        </Text>
        <Text size="xl" fw={800} c={color}>
          {value}
        </Text>
      </Paper>
    </motion.div>
  );
}
