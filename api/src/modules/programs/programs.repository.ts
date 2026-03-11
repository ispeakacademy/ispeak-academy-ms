import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Program } from './entities/program.entity';

@Injectable()
export class ProgramsRepository extends AbstractRepository<Program> {
	constructor(
		@InjectRepository(Program)
		private readonly programRepository: Repository<Program>,
	) {
		super(programRepository);
	}

	createQueryBuilder(alias: string) {
		return this.programRepository.createQueryBuilder(alias);
	}
}
