import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { EmployeeRole } from '@/common/enums/employee-role.enum';
import { EmployeeStatus } from '@/common/enums/employee-status.enum';
import { SessionStatus } from '@/common/enums/session-status.enum';
import { UserStatus } from '@/common/enums/user-status.enum';
import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, Repository } from 'typeorm';
import { AuditService } from '../audit/audit.service';
import { Session } from '../cohorts/entities/session.entity';
import { Cohort } from '../cohorts/entities/cohort.entity';
import { UsersRepository } from '../users/users.repository';
import { UsersService } from '../users/users.service';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';
import { TrainerAvailabilityBlock } from './entities/trainer-availability-block.entity';
import { EmployeesRepository } from './employees.repository';

@Injectable()
export class EmployeesService {
	constructor(
		private readonly employeesRepository: EmployeesRepository,
		@InjectRepository(TrainerAvailabilityBlock)
		private readonly availabilityBlockRepository: Repository<TrainerAvailabilityBlock>,
		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>,
		@InjectRepository(Cohort)
		private readonly cohortRepository: Repository<Cohort>,
		private readonly usersService: UsersService,
		private readonly usersRepository: UsersRepository,
		private readonly auditService: AuditService,
	) {}

	async create(dto: CreateEmployeeDto, creatorId: string): Promise<Employee> {
		// Check for duplicate email
		const existing = await this.employeesRepository.findOne({ where: { email: dto.email } });
		if (existing) {
			throw new ConflictException('An employee with this email already exists');
		}

		// Create linked user account via UsersService
		const user = await this.usersService.createStaffUser(
			{
				email: dto.email,
				password: dto.password,
				roleId: dto.roleId,
				firstName: dto.firstName,
				lastName: dto.lastName,
				phone: dto.phone,
			},
			creatorId,
		);

		// Create the employee record
		const employeeData: Partial<Employee> = {
			firstName: dto.firstName,
			lastName: dto.lastName,
			email: dto.email,
			phone: dto.phone,
			profilePhotoUrl: dto.profilePhotoUrl,
			role: dto.role,
			employmentType: dto.employmentType,
			specialization: dto.specialization,
			certifications: dto.certifications || [],
			bio: dto.bio,
			startDate: dto.startDate ? new Date(dto.startDate) : undefined,
			endDate: dto.endDate ? new Date(dto.endDate) : undefined,
			hourlyRate: dto.hourlyRate,
			rateCurrency: dto.rateCurrency,
			availableDays: dto.availableDays || [],
			availableHours: dto.availableHours,
			linkedUserId: user.userId,
		};

		const employee = await this.employeesRepository.create(employeeData);

		// Link user back to employee
		await this.usersRepository.update(
			{ userId: user.userId },
			{ linkedEmployeeId: employee.employeeId },
		);

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.EMPLOYEE_CREATED,
			performedBy: creatorId,
			targetType: AuditTargetType.EMPLOYEE,
			targetId: employee.employeeId,
			details: `Created employee "${employee.fullName}" (${employee.email}) with role ${employee.role}`,
			metadata: {
				employeeId: employee.employeeId,
				linkedUserId: user.userId,
				role: employee.role,
				employmentType: employee.employmentType,
			},
		});

		return employee;
	}

	async findByLinkedUserId(userId: string): Promise<Employee | null> {
		return this.employeesRepository.findOne({
			where: { linkedUserId: userId },
			relations: { availabilityBlocks: true },
		});
	}

	async updateOwnProfile(userId: string, dto: UpdateEmployeeDto): Promise<Employee> {
		const employee = await this.findByLinkedUserId(userId);
		if (!employee) {
			throw new NotFoundException('No linked employee record found');
		}

		// Only allow updating safe self-service fields
		const allowedUpdate: Partial<Employee> = {};
		if (dto.bio !== undefined) allowedUpdate.bio = dto.bio;
		if (dto.specialization !== undefined) allowedUpdate.specialization = dto.specialization;
		if (dto.certifications !== undefined) allowedUpdate.certifications = dto.certifications;
		if (dto.availableDays !== undefined) allowedUpdate.availableDays = dto.availableDays;
		if (dto.availableHours !== undefined) allowedUpdate.availableHours = dto.availableHours;
		if (dto.phone !== undefined) allowedUpdate.phone = dto.phone;

		await this.employeesRepository.update(
			{ employeeId: employee.employeeId },
			allowedUpdate as any,
		);

		return this.findByLinkedUserId(userId);
	}

	async findAll(query: QueryEmployeesDto): Promise<{
		data: Employee[];
		pagination: { page: number; limit: number; total: number; totalPages: number };
	}> {
		const { page = 1, limit = 10, role, status, employmentType, search } = query;
		const skip = (page - 1) * limit;

		const where: FindOptionsWhere<Employee>[] = [];
		const baseWhere: FindOptionsWhere<Employee> = {};

		if (role) baseWhere.role = role;
		if (status) baseWhere.status = status;
		if (employmentType) baseWhere.employmentType = employmentType;

		if (search) {
			// Search across firstName, lastName, email
			where.push(
				{ ...baseWhere, firstName: ILike(`%${search}%`) },
				{ ...baseWhere, lastName: ILike(`%${search}%`) },
				{ ...baseWhere, email: ILike(`%${search}%`) },
			);
		}

		const findOptions = {
			where: search ? where : (Object.keys(baseWhere).length > 0 ? baseWhere : undefined),
			relations: { user: { userRole: true } },
			skip,
			take: limit,
			order: { createdAt: 'DESC' as const },
		};

		const [data, total] = await this.employeesRepository.findAndCount(findOptions);

		return {
			data,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async findOne(id: string): Promise<Employee> {
		const employee = await this.employeesRepository.findOne({
			where: { employeeId: id },
			relations: { availabilityBlocks: true, user: { userRole: true } },
		});
		if (!employee) {
			throw new NotFoundException('Employee not found');
		}
		return employee;
	}

	async update(id: string, dto: UpdateEmployeeDto, updaterId: string): Promise<Employee> {
		const employee = await this.findOne(id);

		// If email is changing, check for duplicates
		if (dto.email && dto.email !== employee.email) {
			const existing = await this.employeesRepository.findOne({ where: { email: dto.email } });
			if (existing) {
				throw new ConflictException('An employee with this email already exists');
			}

			// Sync email to linked user account
			if (employee.linkedUserId) {
				await this.usersService.updateProfile(employee.linkedUserId, { email: dto.email });
			}
		}

		// Sync name changes to linked user
		if (employee.linkedUserId && (dto.firstName || dto.lastName)) {
			const nameUpdate: { firstName?: string; lastName?: string } = {};
			if (dto.firstName) nameUpdate.firstName = dto.firstName;
			if (dto.lastName) nameUpdate.lastName = dto.lastName;
			await this.usersService.updateProfile(employee.linkedUserId, nameUpdate);
		}

		await this.employeesRepository.update({ employeeId: id }, dto as any);

		await this.auditService.createLog({
			action: AuditAction.EMPLOYEE_UPDATED,
			performedBy: updaterId,
			targetType: AuditTargetType.EMPLOYEE,
			targetId: id,
			details: `Updated employee "${employee.fullName}" (${employee.email})`,
			metadata: { updatedFields: Object.keys(dto) },
		});

		return this.findOne(id);
	}

	async deactivate(id: string, adminId: string): Promise<Employee> {
		const employee = await this.findOne(id);

		await this.employeesRepository.update(
			{ employeeId: id },
			{ status: EmployeeStatus.INACTIVE },
		);

		// Deactivate linked user account
		if (employee.linkedUserId) {
			await this.usersService.updateUserStatus(
				employee.linkedUserId,
				{ status: UserStatus.INACTIVE },
				adminId,
				employee.fullName,
			);
		}

		await this.auditService.createLog({
			action: AuditAction.EMPLOYEE_DEACTIVATED,
			performedBy: adminId,
			targetType: AuditTargetType.EMPLOYEE,
			targetId: id,
			details: `Deactivated employee "${employee.fullName}" (${employee.email})`,
		});

		return this.findOne(id);
	}

	async getAssignedSessions(
		id: string,
		query: { page?: number; limit?: number },
	): Promise<{
		data: Session[];
		pagination: { page: number; limit: number; total: number; totalPages: number };
	}> {
		await this.findOne(id); // Ensure employee exists

		const page = query.page || 1;
		const limit = query.limit || 10;
		const skip = (page - 1) * limit;

		const [data, total] = await this.sessionRepository.findAndCount({
			where: { trainerId: id },
			skip,
			take: limit,
			order: { scheduledAt: 'DESC' },
			relations: { cohort: true },
		});

		return {
			data,
			pagination: {
				page,
				limit,
				total,
				totalPages: Math.ceil(total / limit),
			},
		};
	}

	async getAssignedCohorts(id: string): Promise<Cohort[]> {
		await this.findOne(id); // Ensure employee exists

		// Find cohorts where this employee is lead trainer or in the trainers array
		const cohorts = await this.cohortRepository
			.createQueryBuilder('cohort')
			.leftJoinAndSelect('cohort.program', 'program')
			.where('cohort.leadTrainerId = :id', { id })
			.orWhere(':id = ANY(SELECT jsonb_array_elements_text(cohort.trainer_ids))', { id })
			.orderBy('cohort.startDate', 'DESC')
			.getMany();

		return cohorts;
	}

	async getWorkload(
		id: string,
		month?: string,
	): Promise<{
		sessionsCount: number;
		totalMinutes: number;
		totalHours: number;
		completedSessions: number;
		upcomingSessions: number;
	}> {
		await this.findOne(id); // Ensure employee exists

		const now = new Date();
		let monthStart: Date;
		let monthEnd: Date;

		if (month) {
			// month format: YYYY-MM
			const [year, mon] = month.split('-').map(Number);
			monthStart = new Date(year, mon - 1, 1);
			monthEnd = new Date(year, mon, 0, 23, 59, 59);
		} else {
			monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
			monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
		}

		const sessions = await this.sessionRepository
			.createQueryBuilder('session')
			.where('session.trainerId = :id', { id })
			.andWhere('session.scheduledAt BETWEEN :start AND :end', {
				start: monthStart,
				end: monthEnd,
			})
			.andWhere('session.status IN (:...statuses)', {
				statuses: [SessionStatus.SCHEDULED, SessionStatus.IN_PROGRESS, SessionStatus.COMPLETED],
			})
			.getMany();

		const totalMinutes = sessions.reduce((sum, s) => sum + (s.durationMinutes || 0), 0);
		const completedSessions = sessions.filter(
			(s) => s.status === SessionStatus.COMPLETED,
		).length;
		const upcomingSessions = sessions.filter(
			(s) => s.status === SessionStatus.SCHEDULED,
		).length;

		return {
			sessionsCount: sessions.length,
			totalMinutes,
			totalHours: Math.round((totalMinutes / 60) * 100) / 100,
			completedSessions,
			upcomingSessions,
		};
	}

	async addAvailabilityBlock(
		id: string,
		dto: CreateAvailabilityBlockDto,
	): Promise<TrainerAvailabilityBlock> {
		await this.findOne(id); // Ensure employee exists

		const startDate = new Date(dto.startDate);
		const endDate = new Date(dto.endDate);

		if (endDate < startDate) {
			throw new BadRequestException('End date must be after start date');
		}

		const block = this.availabilityBlockRepository.create({
			employeeId: id,
			startDate,
			endDate,
			type: dto.type,
			reason: dto.reason,
		});

		return this.availabilityBlockRepository.save(block);
	}

	async getAvailabilityBlocks(id: string): Promise<TrainerAvailabilityBlock[]> {
		await this.findOne(id); // Ensure employee exists

		return this.availabilityBlockRepository.find({
			where: { employeeId: id },
			order: { startDate: 'DESC' },
		});
	}

	async deleteAvailabilityBlock(employeeId: string, blockId: string): Promise<void> {
		await this.findOne(employeeId); // Ensure employee exists

		const block = await this.availabilityBlockRepository.findOne({
			where: { blockId, employeeId },
		});

		if (!block) {
			throw new NotFoundException('Availability block not found');
		}

		await this.availabilityBlockRepository.delete({ blockId });
	}

	async updateRole(employeeId: string, roleId: string, adminId: string): Promise<Employee> {
		const employee = await this.findOne(employeeId);

		if (!employee.linkedUserId) {
			throw new BadRequestException('Employee has no linked user account');
		}

		const updatedUser = await this.usersService.updateUserRole(employee.linkedUserId, roleId, adminId);

		await this.auditService.createLog({
			action: AuditAction.USER_ROLE_CHANGED,
			performedBy: adminId,
			targetType: AuditTargetType.EMPLOYEE,
			targetId: employeeId,
			details: `Changed system role for employee "${employee.fullName}" (${employee.email})`,
			metadata: {
				employeeId,
				linkedUserId: employee.linkedUserId,
				newRoleId: roleId,
			},
		});

		return this.findOne(employeeId);
	}

	async getAvailableTrainers(date: string): Promise<Employee[]> {
		const targetDate = new Date(date);

		const blockedEmployeeIds = await this.availabilityBlockRepository
			.createQueryBuilder('block')
			.select('block.employeeId')
			.where(':date BETWEEN block.startDate AND block.endDate', { date: targetDate })
			.getMany();

		const blockedIds = blockedEmployeeIds.map((b) => b.employeeId);

		const queryBuilder = this.employeesRepository['repository']
			.createQueryBuilder('employee')
			.where('employee.status = :status', { status: EmployeeStatus.ACTIVE })
			.andWhere('employee.role = :role', { role: EmployeeRole.TRAINER });

		if (blockedIds.length > 0) {
			queryBuilder.andWhere('employee.employee_id NOT IN (:...blockedIds)', { blockedIds });
		}

		return queryBuilder.orderBy('employee.first_name', 'ASC').getMany();
	}
}
