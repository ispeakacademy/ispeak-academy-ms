import type { Permission, Role } from '@/types/permissions';
import apiClient from '.';

export const getPermissions = async (): Promise<Permission[]> => {
  const response = await apiClient.get('/permissions');
  return response.data?.data ?? response.data;
};

export const getRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get('/permissions/roles');
  return response.data?.data ?? response.data;
};

export const getRoleById = async (roleId: string): Promise<Role> => {
  const response = await apiClient.get(`/permissions/roles/${roleId}`);
  return response.data?.data ?? response.data;
};

export const updateRolePermissions = async (
  roleId: string,
  permissionIds: string[],
): Promise<Role> => {
  const response = await apiClient.put(`/permissions/roles/${roleId}`, { permissionIds });
  return response.data?.data ?? response.data;
};
