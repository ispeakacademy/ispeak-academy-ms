import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientInteraction } from './entities/client-interaction.entity';

@Injectable()
export class InteractionsRepository extends AbstractRepository<ClientInteraction> {
	constructor(
		@InjectRepository(ClientInteraction)
		private readonly interactionRepository: Repository<ClientInteraction>,
	) {
		super(interactionRepository);
	}

	createQueryBuilder(alias: string) {
		return this.interactionRepository.createQueryBuilder(alias);
	}
}
