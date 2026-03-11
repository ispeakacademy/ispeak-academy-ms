import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesRepository extends AbstractRepository<Employee> {
	constructor(
		@InjectRepository(Employee)
		private readonly employeeRepository: Repository<Employee>,
	) {
		super(employeeRepository);
	}
}
