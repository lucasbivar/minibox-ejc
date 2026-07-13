import { ActionIcon, Loader, Paper, Stack, Table, Text, Title } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { IconTrash } from "@tabler/icons-react";
import { getApiErrorMessage } from "../../api/client";
import { CreateTeamForm } from "./CreateTeamForm";
import { useDeleteTeamMutation, useTeamsQuery } from "./useTeams";

export function EquipesPage() {
  const { data: teams, isLoading } = useTeamsQuery();
  const deleteTeam = useDeleteTeamMutation();

  function handleDeleteTeam(id: string, name: string) {
    modals.openConfirmModal({
      title: "Excluir equipe",
      children: (
        <Text size="sm">
          Tem certeza que deseja excluir a equipe <strong>{name}</strong>?
        </Text>
      ),
      labels: { confirm: "Excluir", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        deleteTeam.mutate(id, {
          onError: (error) =>
            notifications.show({ color: "red", title: "Não foi possível excluir", message: getApiErrorMessage(error) }),
        });
      },
    });
  }

  return (
    <Stack gap="xl">
      <div>
        <Title order={1}>Equipes</Title>
        <Text c="dimmed">Cadastre e gerencie as equipes de serviço do encontro.</Text>
      </div>

      <Paper withBorder radius="md" p="lg">
        <Title order={2} mb="md">
          Equipes de serviço
        </Title>
        <CreateTeamForm />

        {isLoading ? (
          <Loader mt="md" size="sm" />
        ) : (
          <Table mt="md" verticalSpacing="xs" highlightOnHover>
            <Table.Tbody>
              {teams?.map((team) => (
                <Table.Tr key={team.id}>
                  <Table.Td>{team.name}</Table.Td>
                  <Table.Td w={60}>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      aria-label={`Excluir equipe ${team.name}`}
                      onClick={() => handleDeleteTeam(team.id, team.name)}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>
    </Stack>
  );
}
