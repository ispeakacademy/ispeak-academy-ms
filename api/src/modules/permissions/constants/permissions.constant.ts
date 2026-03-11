import { UserRole } from '@/common/enums/user-role.enum';
import { PermissionAction, PermissionResource } from '../entities/permission.entity';

export interface PermissionDefinition {
  resource: PermissionResource;
  action: PermissionAction;
  name: string;
  description: string;
}

export const SYSTEM_PERMISSIONS: PermissionDefinition[] = [
  // Users
  { resource: PermissionResource.USERS, action: PermissionAction.READ, name: 'View Users', description: 'View list of all users' },
  { resource: PermissionResource.USERS, action: PermissionAction.CREATE, name: 'Create Users', description: 'Create new user accounts' },
  { resource: PermissionResource.USERS, action: PermissionAction.UPDATE, name: 'Update Users', description: 'Update user information' },
  { resource: PermissionResource.USERS, action: PermissionAction.DELETE, name: 'Delete Users', description: 'Delete user accounts' },
  // Clients
  { resource: PermissionResource.CLIENTS, action: PermissionAction.READ, name: 'View Clients', description: 'View client records' },
  { resource: PermissionResource.CLIENTS, action: PermissionAction.CREATE, name: 'Create Clients', description: 'Create new clients' },
  { resource: PermissionResource.CLIENTS, action: PermissionAction.UPDATE, name: 'Update Clients', description: 'Update client records' },
  { resource: PermissionResource.CLIENTS, action: PermissionAction.DELETE, name: 'Delete Clients', description: 'Delete/archive clients' },
  { resource: PermissionResource.CLIENTS, action: PermissionAction.EXPORT, name: 'Export Clients', description: 'Export client data' },
  // Organisations
  { resource: PermissionResource.ORGANISATIONS, action: PermissionAction.READ, name: 'View Organisations', description: 'View organisations' },
  { resource: PermissionResource.ORGANISATIONS, action: PermissionAction.CREATE, name: 'Create Organisations', description: 'Create organisations' },
  { resource: PermissionResource.ORGANISATIONS, action: PermissionAction.UPDATE, name: 'Update Organisations', description: 'Update organisations' },
  { resource: PermissionResource.ORGANISATIONS, action: PermissionAction.DELETE, name: 'Delete Organisations', description: 'Delete organisations' },
  // Programs
  { resource: PermissionResource.PROGRAMS, action: PermissionAction.READ, name: 'View Programs', description: 'View program catalog' },
  { resource: PermissionResource.PROGRAMS, action: PermissionAction.CREATE, name: 'Create Programs', description: 'Create new programs' },
  { resource: PermissionResource.PROGRAMS, action: PermissionAction.UPDATE, name: 'Update Programs', description: 'Update programs' },
  { resource: PermissionResource.PROGRAMS, action: PermissionAction.DELETE, name: 'Delete Programs', description: 'Delete programs' },
  // Cohorts
  { resource: PermissionResource.COHORTS, action: PermissionAction.READ, name: 'View Cohorts', description: 'View cohorts' },
  { resource: PermissionResource.COHORTS, action: PermissionAction.CREATE, name: 'Create Cohorts', description: 'Create new cohorts' },
  { resource: PermissionResource.COHORTS, action: PermissionAction.UPDATE, name: 'Update Cohorts', description: 'Update cohorts' },
  { resource: PermissionResource.COHORTS, action: PermissionAction.DELETE, name: 'Delete Cohorts', description: 'Delete cohorts' },
  // Enrollments
  { resource: PermissionResource.ENROLLMENTS, action: PermissionAction.READ, name: 'View Enrollments', description: 'View enrollments' },
  { resource: PermissionResource.ENROLLMENTS, action: PermissionAction.CREATE, name: 'Create Enrollments', description: 'Create new enrollments' },
  { resource: PermissionResource.ENROLLMENTS, action: PermissionAction.UPDATE, name: 'Update Enrollments', description: 'Update enrollments' },
  { resource: PermissionResource.ENROLLMENTS, action: PermissionAction.APPROVE, name: 'Approve Enrollments', description: 'Approve or reject enrollments' },
  { resource: PermissionResource.ENROLLMENTS, action: PermissionAction.DELETE, name: 'Delete Enrollments', description: 'Delete enrollments' },
  // Invoices
  { resource: PermissionResource.INVOICES, action: PermissionAction.READ, name: 'View Invoices', description: 'View invoices' },
  { resource: PermissionResource.INVOICES, action: PermissionAction.CREATE, name: 'Create Invoices', description: 'Create new invoices' },
  { resource: PermissionResource.INVOICES, action: PermissionAction.UPDATE, name: 'Update Invoices', description: 'Update invoices' },
  { resource: PermissionResource.INVOICES, action: PermissionAction.SEND, name: 'Send Invoices', description: 'Send invoices to clients' },
  { resource: PermissionResource.INVOICES, action: PermissionAction.VOID, name: 'Void Invoices', description: 'Void invoices' },
  { resource: PermissionResource.INVOICES, action: PermissionAction.EXPORT, name: 'Export Invoices', description: 'Export invoice data' },
  // Payments
  { resource: PermissionResource.PAYMENTS, action: PermissionAction.READ, name: 'View Payments', description: 'View payments' },
  { resource: PermissionResource.PAYMENTS, action: PermissionAction.CREATE, name: 'Record Payments', description: 'Record payments manually' },
  { resource: PermissionResource.PAYMENTS, action: PermissionAction.UPDATE, name: 'Update Payments', description: 'Update payment records' },
  // Communications
  { resource: PermissionResource.COMMUNICATIONS, action: PermissionAction.READ, name: 'View Communications', description: 'View communication history' },
  { resource: PermissionResource.COMMUNICATIONS, action: PermissionAction.SEND, name: 'Send Communications', description: 'Send messages to clients' },
  // Templates
  { resource: PermissionResource.TEMPLATES, action: PermissionAction.READ, name: 'View Templates', description: 'View message templates' },
  { resource: PermissionResource.TEMPLATES, action: PermissionAction.CREATE, name: 'Create Templates', description: 'Create message templates' },
  { resource: PermissionResource.TEMPLATES, action: PermissionAction.UPDATE, name: 'Update Templates', description: 'Update message templates' },
  { resource: PermissionResource.TEMPLATES, action: PermissionAction.DELETE, name: 'Delete Templates', description: 'Delete message templates' },
  // Settings
  { resource: PermissionResource.SETTINGS, action: PermissionAction.READ, name: 'View Settings', description: 'View system settings' },
  { resource: PermissionResource.SETTINGS, action: PermissionAction.UPDATE, name: 'Update Settings', description: 'Update system settings' },
  // Reports
  { resource: PermissionResource.REPORTS, action: PermissionAction.READ, name: 'View Reports', description: 'View reports and analytics' },
  { resource: PermissionResource.REPORTS, action: PermissionAction.EXPORT, name: 'Export Reports', description: 'Export reports' },
  // Dashboard
  { resource: PermissionResource.DASHBOARD, action: PermissionAction.READ, name: 'View Dashboard', description: 'View admin dashboard' },
  // Employees
  { resource: PermissionResource.EMPLOYEES, action: PermissionAction.READ, name: 'View Employees', description: 'View employees' },
  { resource: PermissionResource.EMPLOYEES, action: PermissionAction.CREATE, name: 'Create Employees', description: 'Create employees' },
  { resource: PermissionResource.EMPLOYEES, action: PermissionAction.UPDATE, name: 'Update Employees', description: 'Update employees' },
  { resource: PermissionResource.EMPLOYEES, action: PermissionAction.DELETE, name: 'Delete Employees', description: 'Delete employees' },
  // Partners
  { resource: PermissionResource.PARTNERS, action: PermissionAction.READ, name: 'View Partners', description: 'View partner records' },
  { resource: PermissionResource.PARTNERS, action: PermissionAction.CREATE, name: 'Create Partners', description: 'Create partners' },
  { resource: PermissionResource.PARTNERS, action: PermissionAction.UPDATE, name: 'Update Partners', description: 'Update partners' },
  { resource: PermissionResource.PARTNERS, action: PermissionAction.DELETE, name: 'Delete Partners', description: 'Delete partners' },
];

export const SUPER_ADMIN_PERMISSIONS = SYSTEM_PERMISSIONS.map(
  (p) => `${p.resource}:${p.action}`,
);

// Admin gets most permissions except delete and void
export const ADMIN_PERMISSIONS = SYSTEM_PERMISSIONS
  .filter(p => ![PermissionAction.DELETE, PermissionAction.VOID].includes(p.action))
  .map(p => `${p.resource}:${p.action}`);

// Finance role permissions
export const FINANCE_PERMISSIONS = SYSTEM_PERMISSIONS
  .filter(p => [
    PermissionResource.INVOICES,
    PermissionResource.PAYMENTS,
    PermissionResource.DASHBOARD,
    PermissionResource.REPORTS,
  ].includes(p.resource) ||
  (p.resource === PermissionResource.CLIENTS && p.action === PermissionAction.READ) ||
  (p.resource === PermissionResource.ENROLLMENTS && p.action === PermissionAction.READ))
  .map(p => `${p.resource}:${p.action}`);

// Trainer role permissions — read on most resources, limited write for their workflow
export const TRAINER_PERMISSIONS = SYSTEM_PERMISSIONS
  .filter(p =>
    // Clients: read + update (log interactions with assigned clients)
    (p.resource === PermissionResource.CLIENTS && [PermissionAction.READ, PermissionAction.UPDATE].includes(p.action)) ||
    // Programs: read only
    (p.resource === PermissionResource.PROGRAMS && p.action === PermissionAction.READ) ||
    // Cohorts: read + update (sessions, attendance)
    (p.resource === PermissionResource.COHORTS && [PermissionAction.READ, PermissionAction.UPDATE].includes(p.action)) ||
    // Enrollments: read + update (progress tracking)
    (p.resource === PermissionResource.ENROLLMENTS && [PermissionAction.READ, PermissionAction.UPDATE].includes(p.action)) ||
    // Communications: read + send (message their students)
    (p.resource === PermissionResource.COMMUNICATIONS && [PermissionAction.READ, PermissionAction.SEND].includes(p.action)) ||
    // Templates: read only (use templates when sending messages)
    (p.resource === PermissionResource.TEMPLATES && p.action === PermissionAction.READ))
  .map(p => `${p.resource}:${p.action}`);

export const ROLE_NAMES = {
  SUPER_ADMIN: UserRole.SUPER_ADMIN,
  ADMIN: UserRole.ADMIN,
  FINANCE: UserRole.FINANCE,
  TRAINER: UserRole.TRAINER,
  PARTNER: UserRole.PARTNER,
  CLIENT: UserRole.CLIENT,
};
