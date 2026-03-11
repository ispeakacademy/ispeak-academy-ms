import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';

@Injectable()
export class AttendanceRepository extends AbstractRepository<Attendance> {
	constructor(
		@InjectRepository(Attendance)
		private readonly attendanceRepository: Repository<Attendance>,
	) {
		super(attendanceRepository);
	}

	createQueryBuilder(alias: string) {
		return this.attendanceRepository.createQueryBuilder(alias);
	}
}
