import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgramModule } from './entities/program-module.entity';

@Injectable()
export class ProgramModulesRepository extends AbstractRepository<ProgramModule> {
	constructor(
		@InjectRepository(ProgramModule)
		private readonly programModuleRepository: Repository<ProgramModule>,
	) {
		super(programModuleRepository);
	}

	createQueryBuilder(alias: string) {
		return this.programModuleRepository.createQueryBuilder(alias);
	}
}
