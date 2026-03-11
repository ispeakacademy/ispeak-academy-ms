import { AbstractEntity } from '@/database/abstract.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './role.entity';

export enum PermissionResource {
  USERS = 'users',
  CLIENTS = 'clients',
  ORGANISATIONS = 'organisations',
  PROGRAMS = 'programs',
  COHORTS = 'cohorts',
  ENROLLMENTS = 'enrollments',
  INVOICES = 'invoices',
  PAYMENTS = 'payments',
  COMMUNICATIONS = 'communications',
  TEMPLATES = 'templates',
  SETTINGS = 'settings',
  REPORTS = 'reports',
  DASHBOARD = 'dashboard',
  EMPLOYEES = 'employees',
  PARTNERS = 'partners',
}

export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  APPROVE = 'approve',
  EXPORT = 'export',
  SEND = 'send',
  VOID = 'void',
}

@Entity('permissions')
export class Permission extends AbstractEntity<Permission> {
  @PrimaryGeneratedColumn('uuid', { name: 'permission_id' })
  permissionId: string;

  @Column({
    type: 'enum',
    enum: PermissionResource,
  })
  resource: PermissionResource;

  @Column({
    type: 'enum',
    enum: PermissionAction,
  })
  action: PermissionAction;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];
}
