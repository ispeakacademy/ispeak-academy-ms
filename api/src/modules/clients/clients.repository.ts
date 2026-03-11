import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Client } from './entities/client.entity';

@Injectable()
export class ClientsRepository extends AbstractRepository<Client> {
	constructor(
		@InjectRepository(Client)
		private readonly clientRepository: Repository<Client>,
	) {
		super(clientRepository);
	}

	createQueryBuilder(alias: string) {
		return this.clientRepository.createQueryBuilder(alias);
	}
}
