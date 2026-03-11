import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import {
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { CreateProgramDto } from './dto/create-program.dto';
import { CreateProgramModuleDto } from './dto/create-program-module.dto';
import { QueryProgramsDto } from './dto/query-programs.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { UpdateProgramModuleDto } from './dto/update-program-module.dto';
import { ProgramModulesRepository } from './program-modules.repository';
import { ProgramsRepository } from './programs.repository';

@Injectable()
export class ProgramsService {
	private readonly logger = new Logger(ProgramsService.name);

	constructor(
		private readonly programsRepository: ProgramsRepository,
		private readonly programModulesRepository: ProgramModulesRepository,
		private readonly auditService: AuditService,
	) {}

	async create(dto: CreateProgramDto, employeeId: string) {
		// Check for duplicate code
		const existingByCode = await this.programsRepository.findOne({
			where: { code: dto.code },
		});
		if (existingByCode) {
			throw new ConflictException(`A program with code "${dto.code}" already exists`);
		}

		const program = await this.programsRepository.create(dto);

		await this.auditService.createLog({
			action: AuditAction.PROGRAM_CREATED,
			performedBy: employeeId,
			targetType: AuditTargetType.PROGRAM,
			targetId: program.programId,
			details: `Program created: ${program.name} (${program.code})`,
		});

		this.logger.log(`Program created: ${program.programId} by employee: ${employeeId}`);

		return program;
	}

	async findAll(query: QueryProgramsDto, currentUser?: JwtPayload) {
		const { page = 1, limit = 20, type, isActive, search } = query;
		const skip = (page - 1) * limit;

		const queryBuilder = this.programsRepository
			.createQueryBuilder('program')
			.leftJoinAndSelect('program.modules', 'modules')
			.where('program.deletedAt IS NULL')
			.orderBy('program.createdAt', 'DESC')
			.addOrderBy('modules.orderIndex', 'ASC')
			.skip(skip)
			.take(limit);

		// Trainers can only see programs they are assigned to
		if (currentUser && !currentUser.isAdminUser && currentUser.linkedEmployeeId) {
			queryBuilder.andWhere(
				'program.trainer_ids @> :trainerFilter',
				{ trainerFilter: JSON.stringify([currentUser.linkedEmployeeId]) },
			);
		}

		if (type) {
			queryBuilder.andWhere('program.type = :type', { type });
		}

		if (isActive !== undefined) {
			queryBuilder.andWhere('program.isActive = :isActive', { isActive });
		}

		if (search) {
			queryBuilder.andWhere(
				'(program.name ILIKE :search OR program.code ILIKE :search OR program.description ILIKE :search)',
				{ search: `%${search}%` },
			);
		}

		const [programs, total] = await queryBuilder.getManyAndCount();

		return {
			data: programs,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(programId: string) {
		const program = await this.programsRepository.findOne({
			where: { programId },
			relations: ['modules'],
		});

		if (!program) {
			throw new NotFoundException(`Program with ID ${programId} not found`);
		}

		// Sort modules by orderIndex
		if (program.modules) {
			program.modules.sort((a, b) => a.orderIndex - b.orderIndex);
		}

		return program;
	}

	async update(programId: string, dto: UpdateProgramDto, employeeId: string) {
		const program = await this.findOne(programId);

		// If updating code, check for duplicates (exclude current program)
		if (dto.code && dto.code !== program.code) {
			const existingByCode = await this.programsRepository.findOne({
				where: { code: dto.code },
			});
			if (existingByCode && existingByCode.programId !== programId) {
				throw new ConflictException(`A program with code "${dto.code}" already exists`);
			}
		}

		const updatedProgram = await this.programsRepository.update(
			{ programId } as any,
			dto as any,
		);

		await this.auditService.createLog({
			action: AuditAction.PROGRAM_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.PROGRAM,
			targetId: programId,
			details: `Program updated: ${program.name}`,
			metadata: { updatedFields: Object.keys(dto) },
		});

		this.logger.log(`Program updated: ${programId} by employee: ${employeeId}`);

		return updatedProgram;
	}

	async softDelete(programId: string, employeeId: string) {
		const program = await this.findOne(programId);

		const queryBuilder = this.programsRepository.createQueryBuilder('program');
		await queryBuilder
			.softDelete()
			.where('program_id = :programId', { programId })
			.execute();

		await this.auditService.createLog({
			action: AuditAction.PROGRAM_DELETED,
			performedBy: employeeId,
			targetType: AuditTargetType.PROGRAM,
			targetId: programId,
			details: `Program archived: ${program.name} (${program.code})`,
		});

		this.logger.log(`Program soft-deleted: ${programId} by employee: ${employeeId}`);

		return { message: 'Program archived successfully' };
	}

	async updateTrainers(programId: string, trainerIds: string[], employeeId: string) {
		const program = await this.findOne(programId);

		await this.programsRepository.update(
			{ programId } as any,
			{ trainerIds } as any,
		);

		await this.auditService.createLog({
			action: AuditAction.PROGRAM_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.PROGRAM,
			targetId: programId,
			details: `Program trainers updated: ${program.name}`,
			metadata: { previousTrainerIds: program.trainerIds, newTrainerIds: trainerIds },
		});

		this.logger.log(`Program ${programId} trainers updated by employee: ${employeeId}`);

		return this.findOne(programId);
	}

	// --- Program Module Management ---

	async addModule(programId: string, dto: CreateProgramModuleDto, employeeId: string) {
		const program = await this.findOne(programId);

		// Auto-assign orderIndex if not provided
		let orderIndex = dto.orderIndex;
		if (orderIndex === undefined) {
			const maxOrder = program.modules.length > 0
				? Math.max(...program.modules.map((m) => m.orderIndex))
				: -1;
			orderIndex = maxOrder + 1;
		}

		const programModule = await this.programModulesRepository.create({
			...dto,
			programId,
			orderIndex,
		});

		await this.auditService.createLog({
			action: AuditAction.PROGRAM_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.PROGRAM,
			targetId: programId,
			details: `Module added to program ${program.code}: ${dto.title}`,
			metadata: { moduleId: programModule.moduleId },
		});

		this.logger.log(`Module added to program ${programId}: ${programModule.moduleId}`);

		return programModule;
	}

	async updateModule(
		programId: string,
		moduleId: string,
		dto: UpdateProgramModuleDto,
		employeeId: string,
	) {
		// Verify program exists
		await this.findOne(programId);

		const module = await this.programModulesRepository.findOne({
			where: { moduleId, programId },
		});

		if (!module) {
			throw new NotFoundException(`Module with ID ${moduleId} not found in program ${programId}`);
		}

		const updatedModule = await this.programModulesRepository.update(
			{ moduleId } as any,
			dto as any,
		);

		await this.auditService.createLog({
			action: AuditAction.PROGRAM_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.PROGRAM,
			targetId: programId,
			details: `Module updated in program: ${module.title}`,
			metadata: { moduleId, updatedFields: Object.keys(dto) },
		});

		return updatedModule;
	}

	async removeModule(programId: string, moduleId: string, employeeId: string) {
		const program = await this.findOne(programId);

		const module = await this.programModulesRepository.findOne({
			where: { moduleId, programId },
		});

		if (!module) {
			throw new NotFoundException(`Module with ID ${moduleId} not found in program ${programId}`);
		}

		await this.programModulesRepository.delete(moduleId);

		await this.auditService.createLog({
			action: AuditAction.PROGRAM_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.PROGRAM,
			targetId: programId,
			details: `Module removed from program ${program.code}: ${module.title}`,
			metadata: { moduleId },
		});

		this.logger.log(`Module removed from program ${programId}: ${moduleId}`);

		return { message: 'Module removed successfully' };
	}

	async getModules(programId: string) {
		await this.findOne(programId);

		const modules = await this.programModulesRepository
			.createQueryBuilder('module')
			.where('module.programId = :programId', { programId })
			.orderBy('module.orderIndex', 'ASC')
			.getMany();

		return modules;
	}
}
