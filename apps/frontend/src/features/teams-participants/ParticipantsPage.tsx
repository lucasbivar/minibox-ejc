import { Button, Group, Loader, Pagination, Paper, Select, Stack, Table, Text, TextInput, Title } from "@mantine/core";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import { useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { accentInsensitiveFilter } from "../../lib/selectFilter";
import { ParticipantForm } from "./ParticipantForm";
import { ParticipantRow } from "./ParticipantRow";
import { useParticipantMutations, useParticipantsQuery } from "./useParticipants";
import { useTeamsQuery } from "./useTeams";

const PAGE_SIZE = 10;

export function ParticipantsPage() {
  const { data: teams } = useTeamsQuery();
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data: participants, isLoading } = useParticipantsQuery({
    teamId: teamFilter ?? undefined,
    search: search || undefined,
    page,
    pageSize: PAGE_SIZE,
  });
  const { create } = useParticipantMutations();
  const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);
  const [isCreateFormVisible, setIsCreateFormVisible] = useState(false);

  const teamOptions = (teams ?? []).map((team) => ({ value: team.id, label: team.name }));
  const totalPages = participants ? Math.max(1, Math.ceil(participants.total / participants.pageSize)) : 1;

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Participantes</Title>
        <Text c="dimmed">Cadastre e gerencie os participantes do encontro.</Text>
      </div>

      <Paper withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Title order={2} m={0}>
            Participantes
          </Title>
          <Button
            leftSection={<IconPlus size={16} />}
            variant={isCreateFormVisible ? "default" : "filled"}
            onClick={() => setIsCreateFormVisible((value) => !value)}
          >
            {isCreateFormVisible ? "Fechar" : "Novo participante"}
          </Button>
        </Group>

        {isCreateFormVisible && (
          <Paper withBorder p="md" radius="md" mb="md">
            <ParticipantForm
              teams={teams ?? []}
              submitLabel="Cadastrar"
              pendingLabel="Cadastrando…"
              isPending={create.isPending}
              errorMessage={createErrorMessage}
              onSubmit={(values) => {
                setCreateErrorMessage(null);
                create.mutate(
                  { name: values.name, teamId: values.teamId, phone: values.phone || null },
                  {
                    onSuccess: () => setIsCreateFormVisible(false),
                    onError: (error) => setCreateErrorMessage(getApiErrorMessage(error)),
                  },
                );
              }}
              onCancel={() => setIsCreateFormVisible(false)}
            />
          </Paper>
        )}

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
            filter={accentInsensitiveFilter}
            data={teamOptions}
            value={teamFilter}
            onChange={(value) => {
              setTeamFilter(value);
              setPage(1);
            }}
          />
        </Group>

        {isLoading && <Loader size="sm" />}
        {participants && participants.items.length === 0 && <Text c="dimmed">Nenhum participante encontrado.</Text>}
        {participants && participants.items.length > 0 && (
          <>
            <Table verticalSpacing="xs" highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Equipe</Table.Th>
                  <Table.Th>Celular</Table.Th>
                  <Table.Th>Ações</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {participants.items.map((participant) => (
                  <ParticipantRow key={participant.id} participant={participant} teams={teams ?? []} />
                ))}
              </Table.Tbody>
            </Table>
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                {participants.total} participante(s) no total
              </Text>
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Group>
          </>
        )}
      </Paper>
    </Stack>
  );
}
