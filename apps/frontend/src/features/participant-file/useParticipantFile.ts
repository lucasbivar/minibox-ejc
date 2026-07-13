import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSettlement, fetchParticipantFile } from "../../api/participants";

function participantFileQueryKey(participantId: string) {
  return ["participant-file", participantId];
}

export function useParticipantFileQuery(participantId: string) {
  return useQuery({
    queryKey: participantFileQueryKey(participantId),
    queryFn: () => fetchParticipantFile(participantId),
    enabled: Boolean(participantId),
  });
}

export function useCreateSettlementMutation(participantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount: number; paymentMethod: "CASH" | "PIX" | "CARD" }) =>
      createSettlement(participantId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: participantFileQueryKey(participantId) }),
  });
}
