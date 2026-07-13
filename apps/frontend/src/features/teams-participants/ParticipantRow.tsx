import { ActionIcon, Group, Paper, Table, Text } from "@mantine/core";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import type { ParticipantDto, TeamDto } from "@minibox/shared";
import { IconPencil, IconTrash } from "@tabler/icons-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { getApiErrorMessage } from "../../api/client";
import { ParticipantForm, toParticipantFormValues } from "./ParticipantForm";
import { useParticipantMutations } from "./useParticipants";

export function ParticipantRow({ participant, teams }: { participant: ParticipantDto; teams: TeamDto[] }) {
  const { update, remove } = useParticipantMutations();
  const [isEditing, setIsEditing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleDelete() {
    modals.openConfirmModal({
      title: "Excluir participante",
      children: (
        <Text size="sm">
          Tem certeza que deseja excluir <strong>{participant.name}</strong>? Essa ação não pode ser desfeita.
        </Text>
      ),
      labels: { confirm: "Excluir", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: () => {
        remove.mutate(participant.id, {
          onError: (error) =>
            notifications.show({
              color: "red",
              title: "Não foi possível excluir",
              message: getApiErrorMessage(error),
            }),
        });
      },
    });
  }

  if (isEditing) {
    return (
      <Table.Tr>
        <Table.Td colSpan={4}>
          <Paper withBorder p="md" radius="md">
            <ParticipantForm
              teams={teams}
              initialValues={toParticipantFormValues(participant)}
              submitLabel="Salvar"
              pendingLabel="Salvando…"
              isPending={update.isPending}
              errorMessage={errorMessage}
              onCancel={() => {
                setIsEditing(false);
                setErrorMessage(null);
              }}
              onSubmit={(values) => {
                setErrorMessage(null);
                update.mutate(
                  { id: participant.id, input: { name: values.name, teamId: values.teamId, phone: values.phone || null } },
                  {
                    onSuccess: () => setIsEditing(false),
                    onError: (error) => setErrorMessage(getApiErrorMessage(error)),
                  },
                );
              }}
            />
          </Paper>
        </Table.Td>
      </Table.Tr>
    );
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Text component={Link} to={`/participantes/${participant.id}`} c="brand.7" fw={600}>
          {participant.name}
        </Text>
      </Table.Td>
      <Table.Td>{participant.teamName}</Table.Td>
      <Table.Td>{participant.phone ?? "—"}</Table.Td>
      <Table.Td>
        <Group gap="xs">
          <ActionIcon variant="subtle" onClick={() => setIsEditing(true)} aria-label={`Editar ${participant.name}`}>
            <IconPencil size={16} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" onClick={handleDelete} aria-label={`Excluir ${participant.name}`}>
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  );
}
