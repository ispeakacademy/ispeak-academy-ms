import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModuleProgress } from './entities/module-progress.entity';

@Injectable()
export class ModuleProgressRepository extends AbstractRepository<ModuleProgress> {
	constructor(
		@InjectRepository(ModuleProgress)
		private readonly moduleProgressRepository: Repository<ModuleProgress>,
	) {
		super(moduleProgressRepository);
	}

	createQueryBuilder(alias: string) {
		return this.moduleProgressRepository.createQueryBuilder(alias);
	}
}
