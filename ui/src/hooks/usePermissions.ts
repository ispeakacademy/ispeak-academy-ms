import { parseError } from '@/lib/api/parseError';
import * as permissionsApi from '@/lib/api/permissions.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

export const PERMISSIONS_QUERY_KEYS = {
  all: ['permissions'] as const,
  roles: ['permissions', 'roles'] as const,
  role: (id: string) => ['permissions', 'roles', id] as const,
};

export const usePermissions = () => {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.all,
    queryFn: () => permissionsApi.getPermissions(),
    staleTime: 30 * 60 * 1000,
  });
};

export const useAllRoles = () => {
  return useQuery({
    queryKey: PERMISSIONS_QUERY_KEYS.roles,
    queryFn: () => permissionsApi.getRoles(),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      permissionsApi.updateRolePermissions(roleId, permissionIds),
    onSuccess: (_data, variables) => {
      toast.success('Role permissions updated successfully');
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEYS.roles });
      queryClient.invalidateQueries({ queryKey: PERMISSIONS_QUERY_KEYS.role(variables.roleId) });
    },
    onError: (error) => {
      toast.error(parseError(error, 'Failed to update role permissions'));
    },
  });
};
