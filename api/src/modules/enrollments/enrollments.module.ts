import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { AssignmentsModule } from '../assignments/assignments.module';
import { ClientsModule } from '../clients/clients.module';
import { CohortsModule } from '../cohorts/cohorts.module';
import { CommunicationsModule } from '../communications/communications.module';
import { ProgramsModule } from '../programs/programs.module';
import { UsersModule } from '../users/users.module';
import { ProgramModule } from '../programs/entities/program-module.entity';
import { Enrollment } from './entities/enrollment.entity';
import { ModuleProgress } from './entities/module-progress.entity';
import { Waitlist } from './entities/waitlist.entity';
import { EnrollmentsController, WaitlistController } from './enrollments.controller';
import { EnrollmentsRepository } from './enrollments.repository';
import { EnrollmentsService } from './enrollments.service';
import { ModuleProgressRepository } from './module-progress.repository';
import { WaitlistRepository } from './waitlist.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([Enrollment, ModuleProgress, Waitlist, ProgramModule]),
		AuditModule,
		forwardRef(() => AssignmentsModule),
		ClientsModule,
		CohortsModule,
		CommunicationsModule,
		ProgramsModule,
		UsersModule,
	],
	controllers: [EnrollmentsController, WaitlistController],
	providers: [
		EnrollmentsService,
		EnrollmentsRepository,
		ModuleProgressRepository,
		WaitlistRepository,
	],
	exports: [EnrollmentsService, EnrollmentsRepository],
})
export class EnrollmentsModule {}
