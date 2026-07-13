import {
  Group,
  Loader,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title,
  UnstyledButton,
} from "@mantine/core";
import type { DebtorSortBy, SortDirection } from "@minibox/shared";
import { IconArrowsSort, IconChevronDown, IconChevronUp, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTeamsQuery } from "../teams-participants/useTeams";
import { formatCurrency } from "../../lib/format";
import { useDebtorsQuery } from "./useDebtors";

const PAGE_SIZE = 20;

function SortableHeader({
  label,
  sortKey,
  currentSortBy,
  currentSortDir,
  onSort,
}: {
  label: string;
  sortKey: DebtorSortBy;
  currentSortBy: DebtorSortBy;
  currentSortDir: SortDirection;
  onSort: (key: DebtorSortBy) => void;
}) {
  const isActive = currentSortBy === sortKey;
  const Icon = isActive ? (currentSortDir === "asc" ? IconChevronUp : IconChevronDown) : IconArrowsSort;

  return (
    <Table.Th>
      <UnstyledButton onClick={() => onSort(sortKey)} style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <Text fw={600} size="sm">
          {label}
        </Text>
        <Icon size={14} color={isActive ? "var(--mantine-primary-color-filled)" : "var(--mantine-color-gray-5)"} />
      </UnstyledButton>
    </Table.Th>
  );
}

export function DebtorsPage() {
  const { data: teams } = useTeamsQuery();
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<DebtorSortBy>("value");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const { data: debtors, isLoading } = useDebtorsQuery({
    teamId: teamFilter ?? undefined,
    search: search || undefined,
    sortBy,
    sortDir,
    page,
    pageSize: PAGE_SIZE,
  });

  const teamOptions = (teams ?? []).map((team) => ({ value: team.id, label: team.name }));
  const totalPages = debtors ? Math.max(1, Math.ceil(debtors.total / debtors.pageSize)) : 1;

  function handleSort(key: DebtorSortBy) {
    if (sortBy === key) {
      setSortDir((current) => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir(key === "value" ? "desc" : "asc");
    }
    setPage(1);
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Devedores</Title>
        <Text c="dimmed">Participantes com saldo em aberto (fiado ainda não quitado).</Text>
      </div>

      <Paper withBorder radius="md" p="lg">
        <Group grow mb="md">
          <TextInput
            label="Buscar por nome"
            placeholder="Digite o nome…"
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Filtrar por equipe"
            placeholder="Todas as equipes"
            searchable
            clearable
            data={teamOptions}
            value={teamFilter}
            onChange={(value) => {
              setTeamFilter(value);
              setPage(1);
            }}
          />
        </Group>

        {isLoading && <Loader size="sm" />}
        {debtors && debtors.items.length === 0 && (
          <Text c="dimmed">Nenhum devedor encontrado para os filtros selecionados.</Text>
        )}
        {debtors && debtors.items.length > 0 && (
          <>
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <SortableHeader
                    label="Nome"
                    sortKey="name"
                    currentSortBy={sortBy}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Equipe"
                    sortKey="team"
                    currentSortBy={sortBy}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                  <Table.Th>Celular</Table.Th>
                  <SortableHeader
                    label="Valor devido"
                    sortKey="value"
                    currentSortBy={sortBy}
                    currentSortDir={sortDir}
                    onSort={handleSort}
                  />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {debtors.items.map((debtor) => (
                  <Table.Tr key={debtor.participantId}>
                    <Table.Td>
                      <Text component={Link} to={`/participantes/${debtor.participantId}`} c="brand.7" fw={600}>
                        {debtor.participantName}
                      </Text>
                    </Table.Td>
                    <Table.Td>{debtor.teamName}</Table.Td>
                    <Table.Td>{debtor.phone ?? "—"}</Table.Td>
                    <Table.Td>
                      <Text fw={600} c="red.7">
                        {formatCurrency(debtor.outstandingBalance)}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                {debtors.total} devedor(es) no total
              </Text>
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}
