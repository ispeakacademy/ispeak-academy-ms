import { Role } from "./permissions";

export interface User {
  userId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  roleId: string;
  status: string;
  isAdminUser: boolean;
  emailVerified: boolean;
  mustChangePassword?: boolean;
  lastLoginAt?: string | null;
  linkedEmployeeId?: string | null;
  userRole: Role;
}
