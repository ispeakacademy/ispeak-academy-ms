import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { Program } from './entities/program.entity';
import { ProgramModule } from './entities/program-module.entity';
import { ProgramsController } from './programs.controller';
import { ProgramsRepository } from './programs.repository';
import { ProgramModulesRepository } from './program-modules.repository';
import { ProgramsService } from './programs.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([Program, ProgramModule]),
		AuditModule,
	],
	controllers: [ProgramsController],
	providers: [ProgramsService, ProgramsRepository, ProgramModulesRepository],
	exports: [ProgramsService, ProgramsRepository],
})
export class ProgramsModule {}
