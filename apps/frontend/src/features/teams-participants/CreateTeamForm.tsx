import { Alert, Button, Group, TextInput } from "@mantine/core";
import { IconAlertCircle } from "@tabler/icons-react";
import { type FormEvent, useState } from "react";
import { getApiErrorMessage } from "../../api/client";
import { useCreateTeamMutation } from "./useTeams";

export function CreateTeamForm() {
  const createTeam = useCreateTeamMutation();
  const [name, setName] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    createTeam.mutate(name, {
      onSuccess: () => setName(""),
      onError: (error) => setErrorMessage(getApiErrorMessage(error, "Não foi possível cadastrar a equipe.")),
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      {errorMessage && (
        <Alert color="red" icon={<IconAlertCircle size={18} />} mb="sm" role="alert">
          {errorMessage}
        </Alert>
      )}
      <Group align="end">
        <TextInput
          id="new-team-name"
          label="Nova equipe de serviço"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          style={{ flex: 1 }}
        />
        <Button type="submit" loading={createTeam.isPending}>
          Adicionar equipe
        </Button>
      </Group>
    </form>
  );
}
