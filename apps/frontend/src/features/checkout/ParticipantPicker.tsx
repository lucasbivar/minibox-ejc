import { Badge, Button, Group, Paper, Select, Text, Title } from "@mantine/core";
import { IconUserPlus } from "@tabler/icons-react";
import { useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { accentInsensitiveFilter } from "../../lib/selectFilter";
import { useCartStore } from "../../stores/cartStore";
import { ParticipantForm } from "../teams-participants/ParticipantForm";
import { useParticipantMutations, useParticipantsQuery } from "../teams-participants/useParticipants";
import { useTeamsQuery } from "../teams-participants/useTeams";

export function ParticipantPicker() {
  const { data: teams } = useTeamsQuery();
  const team = useCartStore((state) => state.team);
  const participant = useCartStore((state) => state.participant);
  const setTeam = useCartStore((state) => state.setTeam);
  const setParticipant = useCartStore((state) => state.setParticipant);

  const [isQuickRegisterOpen, setIsQuickRegisterOpen] = useState(false);
  const [quickRegisterError, setQuickRegisterError] = useState<string | null>(null);

  const { data: participantsPage } = useParticipantsQuery({ teamId: team?.id, pageSize: 200 });
  const { create } = useParticipantMutations();

  const participants = participantsPage?.items ?? [];
  const teamOptions = (teams ?? []).map((t) => ({ value: t.id, label: t.name }));
  const participantOptions = participants.map((p) => ({ value: p.id, label: p.name }));

  return (
    <Paper withBorder radius="md" p="lg">
      <Title order={2} mb="md">
        1. Equipe e participante
      </Title>

      <Select
        id="checkout-team"
        label="Equipe de serviço"
        placeholder="Selecione ou busque a equipe…"
        searchable
        filter={accentInsensitiveFilter}
        data={teamOptions}
        value={team?.id ?? null}
        onChange={(value) => {
          const selected = teams?.find((t) => t.id === value) ?? null;
          setTeam(selected);
          setIsQuickRegisterOpen(false);
        }}
        mb="md"
      />

      {team && (
        <>
          {participant ? (
            <Group mb="md">
              <Text component="span">Selecionado:</Text>
              <Badge color="brand">{participant.name}</Badge>
              <Button variant="subtle" size="xs" onClick={() => setParticipant(null)}>
                Trocar participante
              </Button>
            </Group>
          ) : (
            <>
              <Select
                id="checkout-participant"
                label="Participante"
                placeholder="Busque pelo nome…"
                searchable
                filter={accentInsensitiveFilter}
                nothingFoundMessage="Nenhum participante encontrado."
                data={participantOptions}
                value={null}
                onChange={(value) => {
                  const selected = participants.find((p) => p.id === value) ?? null;
                  setParticipant(selected);
                }}
                mb="sm"
              />

              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconUserPlus size={16} />}
                onClick={() => setIsQuickRegisterOpen((value) => !value)}
              >
                {isQuickRegisterOpen ? "Cancelar cadastro rápido" : "Cadastro rápido de participante"}
              </Button>

              {isQuickRegisterOpen && (
                <Paper withBorder p="md" radius="md" mt="md">
                  <ParticipantForm
                    teams={teams ?? []}
                    initialValues={{ teamId: team.id }}
                    submitLabel="Cadastrar e selecionar"
                    pendingLabel="Cadastrando…"
                    isPending={create.isPending}
                    errorMessage={quickRegisterError}
                    onCancel={() => setIsQuickRegisterOpen(false)}
                    onSubmit={(values) => {
                      setQuickRegisterError(null);
                      create.mutate(
                        { name: values.name, teamId: values.teamId, phone: values.phone || null },
                        {
                          onSuccess: (createdParticipant) => {
                            setParticipant(createdParticipant);
                            setIsQuickRegisterOpen(false);
                          },
                          onError: (error) => setQuickRegisterError(getApiErrorMessage(error)),
                        },
                      );
                    }}
                  />
                </Paper>
              )}
            </>
          )}
        </>
      )}
    </Paper>
  );
}
