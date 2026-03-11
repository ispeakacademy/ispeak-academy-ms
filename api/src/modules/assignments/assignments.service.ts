import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { AssignmentStatus } from '@/common/enums/assignment-status.enum';
import { SubmissionStatus } from '@/common/enums/submission-status.enum';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import {
	BadRequestException,
	ForbiddenException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AuditService } from '../audit/audit.service';
import { EnrollmentsRepository } from '../enrollments/enrollments.repository';
import { User } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AssignmentSubmissionsRepository } from './assignment-submissions.repository';
import { AssignmentsRepository } from './assignments.repository';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

@Injectable()
export class AssignmentsService {
	private readonly logger = new Logger(AssignmentsService.name);

	constructor(
		private readonly assignmentsRepository: AssignmentsRepository,
		private readonly submissionsRepository: AssignmentSubmissionsRepository,
		private readonly enrollmentsRepository: EnrollmentsRepository,
		private readonly auditService: AuditService,
		private readonly eventEmitter: EventEmitter2,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
	) {}

	async create(dto: CreateAssignmentDto, employeeId: string) {
		if (!dto.enrollmentId && !dto.cohortId) {
			throw new BadRequestException('Either enrollmentId or cohortId is required');
		}

		const assignments = [];

		if (dto.cohortId) {
			// Bulk: create assignment for all active enrollments in cohort
			const enrollments = await this.enrollmentsRepository
				.createQueryBuilder('e')
				.where('e.cohortId = :cohortId', { cohortId: dto.cohortId })
				.andWhere('e.status IN (:...statuses)', { statuses: ['active', 'confirmed', 'approved'] })
				.andWhere('e.deletedAt IS NULL')
				.getMany();

			if (enrollments.length === 0) {
				throw new BadRequestException('No active enrollments found in this cohort');
			}

			for (const enrollment of enrollments) {
				const assignment = await this.createSingle(dto, enrollment.enrollmentId, enrollment.clientId, dto.cohortId, employeeId);
				assignments.push(assignment);
			}
		} else if (dto.enrollmentId) {
			const enrollment = await this.enrollmentsRepository.findOne({
				where: { enrollmentId: dto.enrollmentId },
			});
			if (!enrollment) {
				throw new NotFoundException(`Enrollment ${dto.enrollmentId} not found`);
			}
			const assignment = await this.createSingle(dto, dto.enrollmentId, enrollment.clientId, null, employeeId);
			assignments.push(assignment);
		}

		return assignments.length === 1 ? assignments[0] : assignments;
	}

	private async createSingle(
		dto: CreateAssignmentDto,
		enrollmentId: string,
		clientId: string,
		cohortId: string | null,
		employeeId: string,
	) {
		const assignment = await this.assignmentsRepository.create({
			enrollmentId,
			cohortId,
			moduleId: dto.moduleId,
			title: dto.title,
			description: dto.description,
			links: dto.links || [],
			attachmentUrls: dto.attachmentUrls || [],
			dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
			status: AssignmentStatus.PUBLISHED,
			createdByEmployeeId: employeeId,
		});

		// Create a pending submission for the client
		await this.submissionsRepository.create({
			assignmentId: assignment.assignmentId,
			clientId,
			status: SubmissionStatus.PENDING,
		});

		await this.auditService.createLog({
			action: AuditAction.ASSIGNMENT_CREATED,
			performedBy: employeeId,
			targetType: AuditTargetType.ASSIGNMENT,
			targetId: assignment.assignmentId,
			details: `Assignment "${dto.title}" created for enrollment ${enrollmentId}`,
			metadata: { enrollmentId, cohortId },
		});

		// Find the client's user account for notification
		const user = await this.userRepository.findOne({ where: { linkedClientId: clientId } });
		if (user) {
			const enrollment = await this.enrollmentsRepository.findOne({
				where: { enrollmentId },
				relations: ['program'],
			});
			this.eventEmitter.emit('assignment.created', {
				assignmentId: assignment.assignmentId,
				title: dto.title,
				enrollmentId,
				clientUserId: user.userId,
				programName: enrollment?.program?.name || 'Program',
			});
		}

		return assignment;
	}

	async findAll(query: QueryAssignmentsDto, currentUser?: JwtPayload) {
		const { page = 1, limit = 20, enrollmentId, cohortId, moduleId, own, status } = query;
		const skip = (page - 1) * limit;

		const qb = this.assignmentsRepository
			.createQueryBuilder('a')
			.leftJoinAndSelect('a.submissions', 'sub')
			.leftJoinAndSelect('a.enrollment', 'enrollment')
			.leftJoinAndSelect('enrollment.client', 'client')
			.leftJoinAndSelect('enrollment.program', 'program')
			.where('a.deletedAt IS NULL')
			.orderBy('a.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		if (own && currentUser?.linkedClientId) {
			qb.andWhere('enrollment.clientId = :clientId', { clientId: currentUser.linkedClientId });
		}

		if (enrollmentId) {
			qb.andWhere('a.enrollmentId = :enrollmentId', { enrollmentId });
		}

		if (cohortId) {
			qb.andWhere('a.cohortId = :cohortId', { cohortId });
		}

		if (moduleId) {
			qb.andWhere('a.moduleId = :moduleId', { moduleId });
		}

		if (status) {
			qb.andWhere('a.status = :status', { status });
		}

		const [assignments, total] = await qb.getManyAndCount();

		return {
			data: assignments,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(id: string) {
		const assignment = await this.assignmentsRepository.findOne({
			where: { assignmentId: id },
			relations: ['submissions', 'enrollment', 'enrollment.client', 'enrollment.program'],
		});

		if (!assignment) {
			throw new NotFoundException(`Assignment ${id} not found`);
		}

		return assignment;
	}

	async update(id: string, dto: UpdateAssignmentDto, employeeId: string) {
		const assignment = await this.findOne(id);

		await this.assignmentsRepository.update(
			{ assignmentId: id } as any,
			{
				...dto,
				dueDate: dto.dueDate ? new Date(dto.dueDate) : assignment.dueDate,
			} as any,
		);

		await this.auditService.createLog({
			action: AuditAction.ASSIGNMENT_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.ASSIGNMENT,
			targetId: id,
			details: `Assignment "${assignment.title}" updated`,
			metadata: { changes: dto },
		});

		return this.findOne(id);
	}

	async delete(id: string, employeeId: string) {
		const assignment = await this.findOne(id);

		// Soft delete
		await this.assignmentsRepository.update(
			{ assignmentId: id } as any,
			{ deletedAt: new Date() } as any,
		);

		await this.auditService.createLog({
			action: AuditAction.ASSIGNMENT_DELETED,
			performedBy: employeeId,
			targetType: AuditTargetType.ASSIGNMENT,
			targetId: id,
			details: `Assignment "${assignment.title}" deleted`,
		});
	}

	async reviewSubmission(submissionId: string, dto: ReviewSubmissionDto, employeeId: string) {
		const submission = await this.submissionsRepository.findOne({
			where: { submissionId },
		});

		if (!submission) {
			throw new NotFoundException(`Submission ${submissionId} not found`);
		}

		if (submission.status !== SubmissionStatus.SUBMITTED) {
			throw new BadRequestException(`Can only review submitted assignments. Current status: ${submission.status}`);
		}

		await this.submissionsRepository.update(
			{ submissionId } as any,
			{
				status: dto.status,
				reviewedAt: new Date(),
				reviewedByEmployeeId: employeeId,
				reviewerFeedback: dto.feedback,
				score: dto.score,
			} as any,
		);

		const assignment = await this.assignmentsRepository.findOne({
			where: { assignmentId: submission.assignmentId },
			relations: ['enrollment'],
		});

		await this.auditService.createLog({
			action: AuditAction.ASSIGNMENT_REVIEWED,
			performedBy: employeeId,
			targetType: AuditTargetType.ASSIGNMENT,
			targetId: submission.assignmentId,
			details: `Assignment submission reviewed — status: ${dto.status}`,
			metadata: { submissionId, status: dto.status, score: dto.score },
		});

		// Notify client
		if (assignment?.enrollment) {
			const user = await this.userRepository.findOne({ where: { linkedClientId: submission.clientId } });
			if (user) {
				this.eventEmitter.emit('assignment.reviewed', {
					assignmentId: submission.assignmentId,
					title: assignment.title,
					clientUserId: user.userId,
					status: dto.status,
					enrollmentId: assignment.enrollmentId,
				});
			}
		}

		return this.submissionsRepository.findOne({ where: { submissionId } });
	}

	async getMyAssignments(clientId: string) {
		this.logger.log(`Fetching assignments for client: ${clientId}`);

		// Use raw query to bypass any TypeORM abstraction issues
		const rawSubmissions = await this.submissionsRepository
			.createQueryBuilder('sub')
			.where('sub.clientId = :clientId', { clientId })
			.getMany();

		this.logger.log(`Raw submissions found: ${rawSubmissions.length}`);

		if (rawSubmissions.length === 0) {
			return [];
		}

		const assignmentIds = [...new Set(rawSubmissions.map((s) => s.assignmentId))];
		this.logger.log(`Assignment IDs: ${JSON.stringify(assignmentIds)}`);

		// Load full assignments with relations using query builder
		const assignments = await this.assignmentsRepository
			.createQueryBuilder('a')
			.leftJoinAndSelect('a.submissions', 'sub')
			.leftJoinAndSelect('a.enrollment', 'enrollment')
			.leftJoinAndSelect('enrollment.program', 'program')
			.where('a.assignmentId IN (:...ids)', { ids: assignmentIds })
			.andWhere('a.status = :status', { status: AssignmentStatus.PUBLISHED })
			.andWhere('a.deletedAt IS NULL')
			.orderBy('a.createdAt', 'DESC')
			.getMany();

		this.logger.log(`Full assignments loaded: ${assignments.length}`);

		// Filter submissions to only include this client's own submission
		return assignments.map((a) => ({
			...a,
			submissions: (a.submissions || []).filter((s) => s.clientId === clientId),
		}));
	}

	async submitAssignment(assignmentId: string, dto: SubmitAssignmentDto, clientId: string) {
		const assignment = await this.findOne(assignmentId);

		// Verify client owns this assignment
		const submission = await this.submissionsRepository.findOne({
			where: { assignmentId, clientId },
		});

		if (!submission) {
			throw new ForbiddenException('You do not have access to this assignment');
		}

		if (submission.status !== SubmissionStatus.PENDING && submission.status !== SubmissionStatus.REVISION_REQUESTED) {
			throw new BadRequestException(`Cannot submit — current status: ${submission.status}`);
		}

		await this.submissionsRepository.update(
			{ submissionId: submission.submissionId } as any,
			{
				status: SubmissionStatus.SUBMITTED,
				submittedAt: new Date(),
				notes: dto.notes,
				attachmentUrls: dto.attachmentUrls || [],
			} as any,
		);

		// Notify trainer/admin
		const creatorUser = await this.userRepository.findOne({ where: { linkedEmployeeId: assignment.createdByEmployeeId } });
		const clientUser = await this.userRepository.findOne({ where: { linkedClientId: clientId } });

		if (creatorUser) {
			const enrollment = assignment.enrollment;
			const clientName = enrollment?.client
				? `${enrollment.client.firstName} ${enrollment.client.lastName}`
				: 'A client';

			this.eventEmitter.emit('assignment.submitted', {
				assignmentId,
				title: assignment.title,
				clientName,
				trainerUserId: creatorUser.userId,
				enrollmentId: assignment.enrollmentId,
			});
		}

		await this.auditService.createLog({
			action: AuditAction.ASSIGNMENT_SUBMITTED,
			performedBy: clientUser?.userId || clientId,
			targetType: AuditTargetType.ASSIGNMENT,
			targetId: assignmentId,
			details: `Assignment "${assignment.title}" submitted by client`,
		});

		return this.submissionsRepository.findOne({ where: { submissionId: submission.submissionId } });
	}

	async getAssignmentSummaryForEnrollment(enrollmentId: string) {
		const submissions = await this.submissionsRepository
			.createQueryBuilder('sub')
			.innerJoin('sub.assignment', 'a')
			.where('a.enrollmentId = :enrollmentId', { enrollmentId })
			.andWhere('a.deletedAt IS NULL')
			.getMany();

		return {
			total: submissions.length,
			pending: submissions.filter((s) => s.status === SubmissionStatus.PENDING).length,
			submitted: submissions.filter((s) => s.status === SubmissionStatus.SUBMITTED).length,
			reviewed: submissions.filter((s) => s.status === SubmissionStatus.REVIEWED).length,
			revisionRequested: submissions.filter((s) => s.status === SubmissionStatus.REVISION_REQUESTED).length,
		};
	}

	async getAssignmentsByEnrollment(enrollmentId: string) {
		return this.assignmentsRepository
			.createQueryBuilder('a')
			.leftJoinAndSelect('a.submissions', 'sub')
			.where('a.enrollmentId = :enrollmentId', { enrollmentId })
			.andWhere('a.deletedAt IS NULL')
			.orderBy('a.createdAt', 'DESC')
			.getMany();
	}
}
