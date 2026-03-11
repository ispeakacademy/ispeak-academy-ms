import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DatabaseModule } from './database/database.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { CommunicationsModule } from './modules/communications/communications.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { LoggingModule } from './modules/logging/logging.module';
import { CohortsModule } from './modules/cohorts/cohorts.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { InvoicesModule } from './modules/invoices/invoices.module';
import { MpesaModule } from './modules/mpesa/mpesa.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { OrganisationsModule } from './modules/organisations/organisations.module';
import { PermissionsModule } from './modules/permissions/permissions.module';
import { ProgramsModule } from './modules/programs/programs.module';
import { SettingsModule } from './modules/settings/settings.module';
import { StorageModule } from './modules/storage/storage.module';
import { UsersModule } from './modules/users/users.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validationSchema: Joi.object({
				PORT: Joi.number().required(),
				API_PREFIX: Joi.string(),

				DATABASE_HOST: Joi.string().required(),
				DATABASE_PORT: Joi.number().required(),
				DATABASE_USERNAME: Joi.string().required(),
				DATABASE_PASSWORD: Joi.string().required(),
				DATABASE_NAME: Joi.string().required(),

				ENCRYPTION_KEY: Joi.string().required(),

				JWT_SECRET: Joi.string().required(),
				JWT_EXPIRES_IN: Joi.string().required(),
				JWT_REFRESH_SECRET: Joi.string().required(),
				JWT_REFRESH_EXPIRES_IN: Joi.string().required(),

				AWS_ACCESS_KEY_ID: Joi.string().optional(),
				AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
				AWS_REGION: Joi.string().optional(),
				AWS_S3_BUCKET: Joi.string().optional(),

				FRONTEND_URL: Joi.string().required(),
				BACKEND_URL: Joi.string().required(),

				AT_API_KEY: Joi.string().optional().allow(''),
				AT_USERNAME: Joi.string().optional().default('sandbox'),
				AT_SMS_SHORTCODE: Joi.string().optional().allow(''),

				THROTTLE_TTL: Joi.number().required(),
				THROTTLE_LIMIT: Joi.number().required(),
			})
		}),

		// Rate limiting
		ThrottlerModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: (configService: ConfigService) => ({
				ttl: parseInt(configService.get('THROTTLE_TTL', '60000'), 10),
				limit: parseInt(configService.get('THROTTLE_LIMIT', '100'), 10),
			}),
			inject: [ConfigService],
		}),

		EventEmitterModule.forRoot(),
		ScheduleModule.forRoot(),
		DatabaseModule,
		LoggingModule,
		StorageModule,
		AuditModule,
		PermissionsModule,
		UsersModule,
		AuthModule,
		SettingsModule,
		ClientsModule,
		CommunicationsModule,
		DashboardModule,
		OrganisationsModule,
		ProgramsModule,
		CohortsModule,
		EmployeesModule,
		EnrollmentsModule,
		AssignmentsModule,
		NotificationsModule,
		InvoicesModule,
		MpesaModule,
	],
	providers: [
		// Global guards
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard,
		},
		// Global filters
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter,
		},
		// Global interceptors
		{
			provide: APP_INTERCEPTOR,
			useClass: LoggingInterceptor,
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: TransformInterceptor,
		},
	],
})
export class AppModule { }
