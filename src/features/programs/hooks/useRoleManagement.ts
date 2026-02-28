import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { programRolesService } from '../services/program-roles.service';
import { profileService } from '@/features/profile/services/profile.service';
import type { UserRole } from '@/types/common.types';

export const useAssignRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      profileId: string;
      programId: string;
      role: string;
    }) => {
      const result = await programRolesService.assignRole(data);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    onSuccess: (_, { programId, profileId }) => {
      queryClient.invalidateQueries({ queryKey: ['program-roles', programId] });
      queryClient.invalidateQueries({ queryKey: ['user-programs', profileId] });
    },
  });
};

export const useRemoveRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const result = await programRolesService.removeRole(id);
      if (result.error) throw new Error(result.error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-roles'] });
      queryClient.invalidateQueries({ queryKey: ['user-programs'] });
    },
  });
};

export const useUserPrograms = (profileId: string | undefined) =>
  useQuery({
    queryKey: ['user-programs', profileId],
    queryFn: async () => {
      const result = await programRolesService.getUserPrograms(profileId!);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: !!profileId,
    staleTime: 60_000,
  });

export const useSearchProfiles = (query: string, role?: UserRole) =>
  useQuery({
    queryKey: ['search-profiles', query, role],
    queryFn: async () => {
      const result = await profileService.searchProfiles(query, role);
      if (result.error) throw new Error(result.error.message);
      return result.data!;
    },
    enabled: query.length >= 2,
    staleTime: 10_000,
  });
