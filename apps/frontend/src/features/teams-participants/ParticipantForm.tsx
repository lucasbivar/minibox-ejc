import { Alert, Button, Group, Select, Stack, TextInput } from "@mantine/core";
import type { ParticipantDto, TeamDto } from "@minibox/shared";
import { IconAlertCircle } from "@tabler/icons-react";
import { type FormEvent, useState } from "react";
import { formatBrazilPhone } from "../../lib/phoneMask";

const EMPTY_BRAZIL_PHONE = "+55 ";

export interface ParticipantFormValues {
  name: string;
  teamId: string;
  phone: string;
}

interface ParticipantFormProps {
  teams: TeamDto[];
  initialValues?: Partial<ParticipantFormValues>;
  submitLabel: string;
  pendingLabel: string;
  isPending: boolean;
  errorMessage: string | null;
  onSubmit: (values: ParticipantFormValues) => void;
  onCancel?: () => void;
}

export function ParticipantForm({
  teams,
  initialValues,
  submitLabel,
  pendingLabel,
  isPending,
  errorMessage,
  onSubmit,
  onCancel,
}: ParticipantFormProps) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [teamId, setTeamId] = useState(initialValues?.teamId ?? "");
  const [phone, setPhone] = useState(initialValues?.phone && initialValues.phone.length > 0 ? initialValues.phone : EMPTY_BRAZIL_PHONE);

  const teamOptions = teams.map((team) => ({ value: team.id, label: team.name }));

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPhone = /^\+55\s*$/.test(phone.trim()) ? "" : phone;
    onSubmit({ name, teamId, phone: normalizedPhone });
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} mb="md" role="alert">
          {errorMessage}
        </Alert>
      )}
      <Stack gap="md">
        <TextInput
          id="participant-name"
          label="Nome completo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
        <Select
          id="participant-team"
          label="Equipe de serviço"
          placeholder="Selecione ou busque…"
          searchable
          required
          data={teamOptions}
          value={teamId || null}
          onChange={(value) => setTeamId(value ?? "")}
        />
        <TextInput
          id="participant-phone"
          label="Celular (opcional)"
          value={phone}
          onChange={(event) => setPhone(formatBrazilPhone(event.target.value))}
        />
        <Group>
          <Button type="submit" loading={isPending}>
            {isPending ? pendingLabel : submitLabel}
          </Button>
          {onCancel && (
            <Button type="button" variant="default" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </Group>
      </Stack>
    </form>
  );
}

export function toParticipantFormValues(participant: ParticipantDto): ParticipantFormValues {
  return { name: participant.name, teamId: participant.teamId, phone: participant.phone ?? "" };
}
