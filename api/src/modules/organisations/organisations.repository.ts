import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organisation } from './entities/organisation.entity';

@Injectable()
export class OrganisationsRepository extends AbstractRepository<Organisation> {
	constructor(
		@InjectRepository(Organisation)
		private readonly organisationRepository: Repository<Organisation>,
	) {
		super(organisationRepository);
	}

	createQueryBuilder(alias: string) {
		return this.organisationRepository.createQueryBuilder(alias);
	}
}
