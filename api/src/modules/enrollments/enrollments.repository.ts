import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Enrollment } from './entities/enrollment.entity';

@Injectable()
export class EnrollmentsRepository extends AbstractRepository<Enrollment> {
	constructor(
		@InjectRepository(Enrollment)
		private readonly enrollmentRepository: Repository<Enrollment>,
	) {
		super(enrollmentRepository);
	}

	createQueryBuilder(alias: string) {
		return this.enrollmentRepository.createQueryBuilder(alias);
	}
}
