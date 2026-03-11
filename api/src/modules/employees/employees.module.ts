import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Cohort } from '../cohorts/entities/cohort.entity';
import { Session } from '../cohorts/entities/session.entity';
import { UsersModule } from '../users/users.module';
import { EmployeesController } from './employees.controller';
import { EmployeesRepository } from './employees.repository';
import { EmployeesService } from './employees.service';
import { Employee } from './entities/employee.entity';
import { TrainerAvailabilityBlock } from './entities/trainer-availability-block.entity';

@Module({
	imports: [
		TypeOrmModule.forFeature([Employee, TrainerAvailabilityBlock, Session, Cohort]),
		AuditModule,
		UsersModule,
	],
	controllers: [EmployeesController],
	providers: [EmployeesService, EmployeesRepository],
	exports: [EmployeesService, EmployeesRepository],
})
export class EmployeesModule {}
