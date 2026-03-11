import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Communication } from '../entities/communication.entity';

@Injectable()
export class CommunicationsRepository extends AbstractRepository<Communication> {
	constructor(
		@InjectRepository(Communication)
		private readonly communicationRepository: Repository<Communication>,
	) {
		super(communicationRepository);
	}

	createQueryBuilder(alias: string) {
		return this.communicationRepository.createQueryBuilder(alias);
	}
}
