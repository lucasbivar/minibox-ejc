import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createParticipant,
  deleteParticipant,
  fetchParticipants,
  updateParticipant,
  type CreateParticipantInput,
  type FetchParticipantsOptions,
  type UpdateParticipantInput,
} from "../../api/participants";

const PARTICIPANTS_QUERY_KEY = "participants";

export function useParticipantsQuery(filters: FetchParticipantsOptions) {
  return useQuery({
    queryKey: [PARTICIPANTS_QUERY_KEY, filters],
    queryFn: () => fetchParticipants(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useParticipantMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: [PARTICIPANTS_QUERY_KEY] });

  const create = useMutation({
    mutationFn: (input: CreateParticipantInput) => createParticipant(input),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateParticipantInput }) => updateParticipant(id, input),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteParticipant(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
