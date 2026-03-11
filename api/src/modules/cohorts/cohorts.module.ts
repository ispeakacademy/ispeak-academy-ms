import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { ProgramsModule } from '../programs/programs.module';
import { Attendance } from './entities/attendance.entity';
import { Cohort } from './entities/cohort.entity';
import { Session } from './entities/session.entity';
import { AttendanceRepository } from './attendance.repository';
import { CohortsController, SessionsController } from './cohorts.controller';
import { CohortsRepository } from './cohorts.repository';
import { CohortsService } from './cohorts.service';
import { SessionsRepository } from './sessions.repository';

@Module({
	imports: [
		TypeOrmModule.forFeature([Cohort, Session, Attendance]),
		AuditModule,
		ProgramsModule,
	],
	controllers: [CohortsController, SessionsController],
	providers: [
		CohortsService,
		CohortsRepository,
		SessionsRepository,
		AttendanceRepository,
	],
	exports: [CohortsService, CohortsRepository, SessionsRepository, AttendanceRepository],
})
export class CohortsModule {}
