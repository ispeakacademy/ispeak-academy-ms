import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from './entities/session.entity';

@Injectable()
export class SessionsRepository extends AbstractRepository<Session> {
	constructor(
		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>,
	) {
		super(sessionRepository);
	}

	createQueryBuilder(alias: string) {
		return this.sessionRepository.createQueryBuilder(alias);
	}
}
