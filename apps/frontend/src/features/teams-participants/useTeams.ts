import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTeam, deleteTeam, fetchTeams } from "../../api/teams";

export const TEAMS_QUERY_KEY = "teams";

export function useTeamsQuery() {
  return useQuery({ queryKey: [TEAMS_QUERY_KEY], queryFn: fetchTeams });
}

export function useCreateTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] }),
  });
}

export function useDeleteTeamMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [TEAMS_QUERY_KEY] }),
  });
}
