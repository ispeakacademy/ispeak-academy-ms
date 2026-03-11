import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentSubmission } from './entities/assignment-submission.entity';

@Injectable()
export class AssignmentSubmissionsRepository extends AbstractRepository<AssignmentSubmission> {
	constructor(
		@InjectRepository(AssignmentSubmission)
		private readonly submissionRepository: Repository<AssignmentSubmission>,
	) {
		super(submissionRepository);
	}

	createQueryBuilder(alias: string) {
		return this.submissionRepository.createQueryBuilder(alias);
	}
}
