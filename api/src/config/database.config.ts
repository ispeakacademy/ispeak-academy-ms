import { AuditLog } from '@/modules/audit/entities/audit-log.entity';
import { Assignment } from '@/modules/assignments/entities/assignment.entity';
import { AssignmentSubmission } from '@/modules/assignments/entities/assignment-submission.entity';
import { ClientInteraction } from '@/modules/clients/entities/client-interaction.entity';
import { Client } from '@/modules/clients/entities/client.entity';
import { Attendance } from '@/modules/cohorts/entities/attendance.entity';
import { Cohort } from '@/modules/cohorts/entities/cohort.entity';
import { Session } from '@/modules/cohorts/entities/session.entity';
import { Communication } from '@/modules/communications/entities/communication.entity';
import { MessageTemplate } from '@/modules/communications/entities/message-template.entity';
import { Employee } from '@/modules/employees/entities/employee.entity';
import { TrainerAvailabilityBlock } from '@/modules/employees/entities/trainer-availability-block.entity';
import { Enrollment } from '@/modules/enrollments/entities/enrollment.entity';
import { ModuleProgress } from '@/modules/enrollments/entities/module-progress.entity';
import { Waitlist } from '@/modules/enrollments/entities/waitlist.entity';
import { InvoiceLineItem } from '@/modules/invoices/entities/invoice-line-item.entity';
import { Invoice } from '@/modules/invoices/entities/invoice.entity';
import { Payment } from '@/modules/invoices/entities/payment.entity';
import { Notification } from '@/modules/notifications/entities/notification.entity';
import { Organisation } from '@/modules/organisations/entities/organisation.entity';
import { Permission } from '@/modules/permissions/entities/permission.entity';
import { Role } from '@/modules/permissions/entities/role.entity';
import { ProgramModule } from '@/modules/programs/entities/program-module.entity';
import { Program } from '@/modules/programs/entities/program.entity';
import { SystemSetting } from '@/modules/settings/entities/system-setting.entity';
import { User } from '@/modules/users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

const configService = new ConfigService();

export const entities = [
  User,
  Role,
  Permission,
  SystemSetting,
  AuditLog,
  Client,
  ClientInteraction,
  Organisation,
  Program,
  ProgramModule,
  Cohort,
  Session,
  Attendance,
  Enrollment,
  ModuleProgress,
  Waitlist,
  Invoice,
  InvoiceLineItem,
  Payment,
  Communication,
  MessageTemplate,
  Employee,
  TrainerAvailabilityBlock,
  Assignment,
  AssignmentSubmission,
  Notification,
];

export default new DataSource({
  type: 'postgres',
  host: configService.getOrThrow('DATABASE_HOST'),
  port: configService.getOrThrow('DATABASE_PORT'),
  database: configService.getOrThrow('DATABASE_NAME'),
  username: configService.getOrThrow('DATABASE_USERNAME'),
  password: configService.getOrThrow('DATABASE_PASSWORD'),
  migrations: ['src/database/migrations/**'],
  synchronize: false,
  logging: false,
  migrationsRun: true,
  ssl: process.env.NODE_ENV === 'production',
  extra: {
    connectionLimit: 10,
    ...(process.env.NODE_ENV === 'production' ? {
      ssl: {
        rejectUnauthorized: false
      }
    } : {})
  },
  entities,
});
