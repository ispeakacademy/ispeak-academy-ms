import { User } from '@/types/users';

export function hasPermission(user: User | null, resource: string, action: string): boolean {
  if (!user?.userRole?.permissions) return false;
  if (user.userRole.name === 'super_admin') return true;
  return user.userRole.permissions.some(
    (p) => p.resource === resource && p.action === action,
  );
}

export function getRedirectPath(user: User | null): string {
  if (!user?.userRole) return '/login';
  const roleName = user.userRole.name;
  if (['super_admin', 'admin', 'finance', 'trainer'].includes(roleName)) return '/admin';
  if (roleName === 'client') return '/portal';
  return '/login';
}
