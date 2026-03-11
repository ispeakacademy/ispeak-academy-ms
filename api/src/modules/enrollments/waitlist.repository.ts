import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Waitlist } from './entities/waitlist.entity';

@Injectable()
export class WaitlistRepository extends AbstractRepository<Waitlist> {
	constructor(
		@InjectRepository(Waitlist)
		private readonly waitlistRepository: Repository<Waitlist>,
	) {
		super(waitlistRepository);
	}

	createQueryBuilder(alias: string) {
		return this.waitlistRepository.createQueryBuilder(alias);
	}
}
