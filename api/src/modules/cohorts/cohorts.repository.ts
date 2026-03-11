import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cohort } from './entities/cohort.entity';

@Injectable()
export class CohortsRepository extends AbstractRepository<Cohort> {
	constructor(
		@InjectRepository(Cohort)
		private readonly cohortRepository: Repository<Cohort>,
	) {
		super(cohortRepository);
	}

	createQueryBuilder(alias: string) {
		return this.cohortRepository.createQueryBuilder(alias);
	}
}
