import { BlockType, EmployeeRole, EmployeeStatus, EmploymentType } from './enums';
import { PaginatedResponse } from './clients';
import type { Role } from './permissions';

export interface EmployeeUser {
  userId: string;
  email: string;
  roleId: string;
  userRole?: Role;
}

export interface Employee {
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  profilePhotoUrl?: string | null;
  role: EmployeeRole;
  status: EmployeeStatus;
  employmentType: EmploymentType;
  specialization?: string | null;
  certifications: string[];
  bio?: string | null;
  linkedUserId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  hourlyRate?: number | null;
  rateCurrency?: string | null;
  availableDays: string[];
  availableHours?: { start: string; end: string } | null;
  availabilityBlocks?: TrainerAvailabilityBlock[];
  user?: EmployeeUser | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerAvailabilityBlock {
  blockId: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: BlockType;
  reason?: string | null;
  createdAt: string;
}

export interface CreateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePhotoUrl?: string;
  role: EmployeeRole;
  employmentType: EmploymentType;
  specialization?: string;
  certifications?: string[];
  bio?: string;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  rateCurrency?: string;
  availableDays?: string[];
  availableHours?: { start: string; end: string };
  roleId: string;
  password: string;
}

export interface UpdateEmployeeDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  profilePhotoUrl?: string;
  role?: EmployeeRole;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  specialization?: string;
  certifications?: string[];
  bio?: string;
  startDate?: string;
  endDate?: string;
  hourlyRate?: number;
  rateCurrency?: string;
  availableDays?: string[];
  availableHours?: { start: string; end: string };
}

export interface QueryEmployeesDto {
  page?: number;
  limit?: number;
  role?: EmployeeRole;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  search?: string;
}

export interface CreateAvailabilityBlockDto {
  startDate: string;
  endDate: string;
  type: BlockType;
  reason?: string;
}

export interface WorkloadSummary {
  sessionsCount: number;
  totalMinutes: number;
  totalHours: number;
  completedSessions: number;
  upcomingSessions: number;
}

export type { PaginatedResponse };
