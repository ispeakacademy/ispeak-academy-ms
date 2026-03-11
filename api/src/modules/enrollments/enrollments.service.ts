import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { ClientStatus } from '@/common/enums/client-status.enum';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { CohortStatus } from '@/common/enums/cohort-status.enum';
import { EnrollmentStatus } from '@/common/enums/enrollment-status.enum';
import { ProgressStatus } from '@/common/enums/progress-status.enum';
import {
	BadRequestException,
	ConflictException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
	forwardRef,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { AuditService } from '../audit/audit.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { ClientsRepository } from '../clients/clients.repository';
import { AttendanceRepository } from '../cohorts/attendance.repository';
import { CohortsRepository } from '../cohorts/cohorts.repository';
import { SessionsRepository } from '../cohorts/sessions.repository';
import { EmailService } from '../communications/services/email.service';
import { ProgramsService } from '../programs/programs.service';
import { UsersService } from '../users/users.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { QueryEnrollmentsDto } from './dto/query-enrollments.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { UpdateModuleProgressDto } from './dto/update-module-progress.dto';
import { EnrollmentsRepository } from './enrollments.repository';
import { ModuleProgressRepository } from './module-progress.repository';
import { WaitlistRepository } from './waitlist.repository';

/**
 * Valid enrollment state transitions:
 *
 * APPLIED → APPROVED (admin review)
 * APPLIED → REJECTED (with reason)
 * APPROVED → INVOICE_SENT (invoice generated)
 * INVOICE_SENT → CONFIRMED (payment received)
 * INVOICE_SENT → DROPPED (non-payment)
 * CONFIRMED → ACTIVE (cohort starts)
 * ACTIVE → COMPLETED (all modules done + attendance met)
 * ACTIVE → DROPPED (voluntary or admin)
 * ACTIVE → DEFERRED (moves to next cohort)
 * WAITLISTED → APPLIED (spot opens)
 */
const VALID_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
	[EnrollmentStatus.WAITLISTED]: [EnrollmentStatus.APPLIED],
	[EnrollmentStatus.APPLIED]: [EnrollmentStatus.APPROVED, EnrollmentStatus.REJECTED],
	[EnrollmentStatus.APPROVED]: [EnrollmentStatus.INVOICE_SENT, EnrollmentStatus.CONFIRMED],
	[EnrollmentStatus.INVOICE_SENT]: [EnrollmentStatus.CONFIRMED, EnrollmentStatus.DROPPED],
	[EnrollmentStatus.CONFIRMED]: [EnrollmentStatus.ACTIVE],
	[EnrollmentStatus.ACTIVE]: [EnrollmentStatus.COMPLETED, EnrollmentStatus.DROPPED, EnrollmentStatus.DEFERRED],
	[EnrollmentStatus.COMPLETED]: [],
	[EnrollmentStatus.DROPPED]: [],
	[EnrollmentStatus.DEFERRED]: [EnrollmentStatus.APPLIED],
	[EnrollmentStatus.REJECTED]: [],
};

@Injectable()
export class EnrollmentsService {
	private readonly logger = new Logger(EnrollmentsService.name);

	constructor(
		private readonly enrollmentsRepository: EnrollmentsRepository,
		private readonly moduleProgressRepository: ModuleProgressRepository,
		private readonly waitlistRepository: WaitlistRepository,
		private readonly cohortsRepository: CohortsRepository,
		private readonly clientsRepository: ClientsRepository,
		private readonly programsService: ProgramsService,
		private readonly auditService: AuditService,
		private readonly usersService: UsersService,
		private readonly emailService: EmailService,
		private readonly configService: ConfigService,
		@Inject(forwardRef(() => AssignmentsService))
		private readonly assignmentsService: AssignmentsService,
		private readonly attendanceRepository: AttendanceRepository,
		private readonly sessionsRepository: SessionsRepository,
	) {}

	// --- State Machine ---

	private validateTransition(current: EnrollmentStatus, target: EnrollmentStatus): void {
		const allowed = VALID_TRANSITIONS[current];
		if (!allowed || !allowed.includes(target)) {
			throw new BadRequestException(
				`Invalid status transition: ${current} → ${target}. Allowed transitions from ${current}: ${allowed?.join(', ') || 'none'}`,
			);
		}
	}

	private async transitionStatus(
		enrollmentId: string,
		targetStatus: EnrollmentStatus,
		employeeId: string,
		additionalData?: Record<string, any>,
	) {
		const enrollment = await this.findOne(enrollmentId);
		this.validateTransition(enrollment.status, targetStatus);

		const updateData: any = { status: targetStatus, ...additionalData };

		await this.enrollmentsRepository.update(
			{ enrollmentId } as any,
			updateData,
		);

		const auditActionMap: Partial<Record<EnrollmentStatus, AuditAction>> = {
			[EnrollmentStatus.APPROVED]: AuditAction.ENROLLMENT_APPROVED,
			[EnrollmentStatus.REJECTED]: AuditAction.ENROLLMENT_REJECTED,
			[EnrollmentStatus.CONFIRMED]: AuditAction.ENROLLMENT_CONFIRMED,
			[EnrollmentStatus.DROPPED]: AuditAction.ENROLLMENT_DROPPED,
			[EnrollmentStatus.DEFERRED]: AuditAction.ENROLLMENT_DEFERRED,
			[EnrollmentStatus.COMPLETED]: AuditAction.ENROLLMENT_COMPLETED,
		};

		await this.auditService.createLog({
			action: auditActionMap[targetStatus] || AuditAction.UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.ENROLLMENT,
			targetId: enrollmentId,
			details: `Enrollment status changed from ${enrollment.status} to ${targetStatus}`,
			metadata: { previousStatus: enrollment.status, newStatus: targetStatus, clientId: enrollment.clientId },
		});

		this.logger.log(`Enrollment ${enrollmentId}: ${enrollment.status} → ${targetStatus} by ${employeeId}`);

		return this.findOne(enrollmentId);
	}

	// --- CRUD ---

	async create(dto: CreateEnrollmentDto, employeeId: string) {
		// Verify client exists
		const client = await this.clientsRepository.findOne({
			where: { clientId: dto.clientId },
		});
		if (!client) {
			throw new NotFoundException(`Client with ID ${dto.clientId} not found`);
		}

		// Verify program exists
		await this.programsService.findOne(dto.programId);

		// If cohortId is provided, verify cohort exists
		let cohort: any = null;
		if (dto.cohortId) {
			cohort = await this.cohortsRepository.findOne({
				where: { cohortId: dto.cohortId },
			});
			if (!cohort) {
				throw new NotFoundException(`Cohort with ID ${dto.cohortId} not found`);
			}

			// Check for duplicate enrollment (same client + cohort)
			const existingEnrollment = await this.enrollmentsRepository.findOne({
				where: { clientId: dto.clientId, cohortId: dto.cohortId },
			});
			if (existingEnrollment) {
				throw new ConflictException('Client is already enrolled in this cohort');
			}
		}

		// Determine initial status based on cohort capacity
		let initialStatus = EnrollmentStatus.APPLIED;
		if (cohort && cohort.status === CohortStatus.FULL && cohort.currentEnrollment >= cohort.maxCapacity) {
			initialStatus = EnrollmentStatus.WAITLISTED;
		}

		const enrollment = await this.enrollmentsRepository.create({
			...dto,
			cohortId: dto.cohortId || null,
			status: initialStatus,
			applicationDate: new Date(),
			enrolledByEmployeeId: employeeId,
		});

		// If waitlisted, add to waitlist table
		if (initialStatus === EnrollmentStatus.WAITLISTED && dto.cohortId) {
			const nextPosition = await this.getNextWaitlistPosition(dto.cohortId);
			await this.waitlistRepository.create({
				clientId: dto.clientId,
				cohortId: dto.cohortId,
				position: nextPosition,
			});
		}

		await this.auditService.createLog({
			action: AuditAction.ENROLLMENT_CREATED,
			performedBy: employeeId,
			targetType: AuditTargetType.ENROLLMENT,
			targetId: enrollment.enrollmentId,
			details: `Enrollment created for client ${client.firstName} ${client.lastName} — Status: ${initialStatus}`,
			metadata: { clientId: dto.clientId, cohortId: dto.cohortId || null, programId: dto.programId },
		});

		this.logger.log(`Enrollment created: ${enrollment.enrollmentId} by employee: ${employeeId}`);

		return enrollment;
	}

	async findAll(query: QueryEnrollmentsDto, currentUser?: JwtPayload) {
		const { page = 1, limit = 20, status, cohortId, programId, search, own } = query;
		let { clientId } = query;
		const skip = (page - 1) * limit;

		// When own=true, scope to the current user's linked client
		if (own && currentUser?.linkedClientId) {
			clientId = currentUser.linkedClientId;
		}

		const queryBuilder = this.enrollmentsRepository
			.createQueryBuilder('enrollment')
			.leftJoinAndSelect('enrollment.client', 'client')
			.leftJoinAndSelect('enrollment.cohort', 'cohort')
			.leftJoinAndSelect('enrollment.program', 'program')
			.where('enrollment.deletedAt IS NULL')
			.orderBy('enrollment.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		if (status) {
			queryBuilder.andWhere('enrollment.status = :status', { status });
		}

		if (cohortId) {
			queryBuilder.andWhere('enrollment.cohortId = :cohortId', { cohortId });
		}

		if (programId) {
			queryBuilder.andWhere('enrollment.programId = :programId', { programId });
		}

		if (clientId) {
			queryBuilder.andWhere('enrollment.clientId = :clientId', { clientId });
		}

		if (search) {
			queryBuilder.andWhere(
				'(client.firstName ILIKE :search OR client.lastName ILIKE :search OR client.email ILIKE :search)',
				{ search: `%${search}%` },
			);
		}

		const [enrollments, total] = await queryBuilder.getManyAndCount();

		// Ensure progressPercent is a number (TypeORM returns decimals as strings)
		const data = enrollments.map((e) => ({
			...e,
			progressPercent: Number(e.progressPercent) || 0,
		}));

		return {
			data,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(enrollmentId: string) {
		const enrollment = await this.enrollmentsRepository.findOne({
			where: { enrollmentId },
			relations: ['client', 'cohort', 'program', 'moduleProgress'],
		});

		if (!enrollment) {
			throw new NotFoundException(`Enrollment with ID ${enrollmentId} not found`);
		}

		return enrollment;
	}

	async update(enrollmentId: string, dto: UpdateEnrollmentDto, employeeId: string) {
		const enrollment = await this.findOne(enrollmentId);

		// If cohortId is being changed, verify the new cohort exists
		if (dto.cohortId && dto.cohortId !== enrollment.cohortId) {
			const cohort = await this.cohortsRepository.findOne({
				where: { cohortId: dto.cohortId },
			});
			if (!cohort) {
				throw new NotFoundException(`Cohort with ID ${dto.cohortId} not found`);
			}
		}

		await this.enrollmentsRepository.update(
			{ enrollmentId } as any,
			dto as any,
		);

		await this.auditService.createLog({
			action: AuditAction.UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.ENROLLMENT,
			targetId: enrollmentId,
			details: `Enrollment updated`,
			metadata: { changes: dto },
		});

		this.logger.log(`Enrollment ${enrollmentId} updated by ${employeeId}`);

		return this.findOne(enrollmentId);
	}

	// --- State Transition Endpoints ---

	async approve(enrollmentId: string, employeeId: string) {
		const enrollment = await this.transitionStatus(
			enrollmentId,
			EnrollmentStatus.APPROVED,
			employeeId,
			{
				approvalDate: new Date(),
				approvedByEmployeeId: employeeId,
			},
		);

		// Update cohort enrollment count (only if cohort is assigned)
		if (enrollment.cohortId) {
			await this.incrementCohortEnrollment(enrollment.cohortId);
		}

		// Auto-transition client to ENROLLED if this is their first enrollment
		await this.updateClientStatusOnEnrollment(enrollment.clientId);

		return enrollment;
	}

	async reject(enrollmentId: string, reason: string, employeeId: string) {
		return this.transitionStatus(
			enrollmentId,
			EnrollmentStatus.REJECTED,
			employeeId,
			{ dropReason: reason },
		);
	}

	async markInvoiceSent(enrollmentId: string, employeeId: string) {
		return this.transitionStatus(
			enrollmentId,
			EnrollmentStatus.INVOICE_SENT,
			employeeId,
		);
	}

	async confirm(enrollmentId: string, employeeId: string) {
		const enrollment = await this.transitionStatus(
			enrollmentId,
			EnrollmentStatus.CONFIRMED,
			employeeId,
		);

		// Initialize module progress for the enrollment
		await this.initializeModuleProgress(enrollment.enrollmentId, enrollment.programId, enrollment.selectedModuleIds);

		// Create client portal account and send welcome email
		await this.createClientPortalAccount(enrollment);

		return enrollment;
	}

	async activate(enrollmentId: string, employeeId: string) {
		return this.transitionStatus(
			enrollmentId,
			EnrollmentStatus.ACTIVE,
			employeeId,
		);
	}

	async drop(enrollmentId: string, reason: string, employeeId: string) {
		const enrollment = await this.transitionStatus(
			enrollmentId,
			EnrollmentStatus.DROPPED,
			employeeId,
			{
				dropDate: new Date(),
				dropReason: reason,
			},
		);

		// Decrement cohort enrollment count and notify waitlist (only if cohort is assigned)
		if (enrollment.cohortId) {
			await this.decrementCohortEnrollment(enrollment.cohortId);
			await this.notifyNextWaitlistEntry(enrollment.cohortId);
		}

		return enrollment;
	}

	async defer(enrollmentId: string, newCohortId: string, employeeId: string) {
		const enrollment = await this.findOne(enrollmentId);

		// Verify new cohort exists and accepts enrollments
		const newCohort = await this.cohortsRepository.findOne({
			where: { cohortId: newCohortId },
		});
		if (!newCohort) {
			throw new NotFoundException(`New cohort with ID ${newCohortId} not found`);
		}

		// Mark current enrollment as deferred
		await this.transitionStatus(
			enrollmentId,
			EnrollmentStatus.DEFERRED,
			employeeId,
		);

		// Decrement old cohort enrollment (if assigned)
		if (enrollment.cohortId) {
			await this.decrementCohortEnrollment(enrollment.cohortId);
		}

		// Create new enrollment in the new cohort
		const newEnrollment = await this.enrollmentsRepository.create({
			clientId: enrollment.clientId,
			cohortId: newCohortId,
			programId: enrollment.programId,
			status: EnrollmentStatus.APPLIED,
			applicationDate: new Date(),
			agreedAmount: enrollment.agreedAmount,
			agreedCurrency: enrollment.agreedCurrency,
			discountCode: enrollment.discountCode,
			discountPercent: enrollment.discountPercent,
			scholarshipId: enrollment.scholarshipId,
			selectedModuleIds: enrollment.selectedModuleIds,
			enrolledByEmployeeId: employeeId,
		});

		await this.auditService.createLog({
			action: AuditAction.ENROLLMENT_DEFERRED,
			performedBy: employeeId,
			targetType: AuditTargetType.ENROLLMENT,
			targetId: enrollmentId,
			details: `Enrollment deferred to cohort ${newCohort.batchCode}`,
			metadata: { oldCohortId: enrollment.cohortId, newCohortId, newEnrollmentId: newEnrollment.enrollmentId },
		});

		return newEnrollment;
	}

	async complete(enrollmentId: string, employeeId: string) {
		return this.transitionStatus(
			enrollmentId,
			EnrollmentStatus.COMPLETED,
			employeeId,
			{ completionDate: new Date() },
		);
	}

	// --- Module Progress ---

	async getProgress(enrollmentId: string) {
		const enrollment = await this.findOne(enrollmentId);

		// Get existing progress records (if any)
		const progress = await this.moduleProgressRepository
			.createQueryBuilder('progress')
			.leftJoinAndSelect('progress.module', 'module')
			.where('progress.enrollmentId = :enrollmentId', { enrollmentId })
			.orderBy('module.orderIndex', 'ASC')
			.addOrderBy('progress.createdAt', 'ASC')
			.getMany();

		let modules;
		let progressPercent = 0;

		// If there are progress records, use them
		if (progress.length > 0) {
			modules = progress;
			// Calculate progress on the fly from module status
			const completed = progress.filter((p) => p.status === ProgressStatus.COMPLETED).length;
			progressPercent = Math.round((completed / progress.length) * 100);
		} else {
			// No progress records yet — return program modules with NOT_STARTED status
			const program = await this.programsService.findOne(enrollment.programId);
			const modulesToShow = enrollment.selectedModuleIds?.length > 0
				? program.modules.filter((m) => enrollment.selectedModuleIds.includes(m.moduleId))
				: program.modules;

			modules = modulesToShow
				.sort((a, b) => a.orderIndex - b.orderIndex)
				.map((mod) => ({
					moduleProgressId: null,
					enrollmentId,
					moduleId: mod.moduleId,
					status: ProgressStatus.NOT_STARTED,
					startedAt: null,
					completedAt: null,
					score: null,
					trainerFeedback: null,
					module: mod,
				}));
		}

		// Get assignment summary
		let assignmentSummary = { total: 0, pending: 0, submitted: 0, reviewed: 0, revisionRequested: 0 };
		try {
			assignmentSummary = await this.assignmentsService.getAssignmentSummaryForEnrollment(enrollmentId);
		} catch (error) {
			this.logger.warn(`Failed to get assignment summary for enrollment ${enrollmentId}: ${error.message}`);
		}

		// Get attendance summary
		const attendanceSummary = await this.getAttendanceSummary(enrollmentId, enrollment.cohortId);

		return {
			enrollmentId,
			progressPercent,
			modules,
			assignmentSummary,
			attendanceSummary,
		};
	}

	private async getAttendanceSummary(enrollmentId: string, cohortId?: string) {
		if (!cohortId) {
			return { totalSessions: 0, attended: 0, absent: 0, excused: 0, late: 0, attendanceRate: 0 };
		}

		// Count total sessions for the cohort (completed + scheduled)
		const totalSessions = await this.sessionsRepository
			.createQueryBuilder('s')
			.where('s.cohortId = :cohortId', { cohortId })
			.andWhere('s.status IN (:...statuses)', { statuses: ['completed', 'scheduled'] })
			.getCount();

		// Count attendance records grouped by status
		const attendanceRecords = await this.attendanceRepository
			.createQueryBuilder('a')
			.where('a.enrollmentId = :enrollmentId', { enrollmentId })
			.getMany();

		const attended = attendanceRecords.filter((a) => a.status === 'present').length;
		const absent = attendanceRecords.filter((a) => a.status === 'absent').length;
		const excused = attendanceRecords.filter((a) => a.status === 'excused').length;
		const late = attendanceRecords.filter((a) => a.status === 'late').length;

		const attendanceRate = totalSessions > 0
			? Math.round(((attended + late) / totalSessions) * 100)
			: 0;

		return { totalSessions, attended, absent, excused, late, attendanceRate };
	}

	async updateModuleProgress(
		enrollmentId: string,
		moduleId: string,
		dto: UpdateModuleProgressDto,
		employeeId: string,
	) {
		await this.findOne(enrollmentId);

		let progress = await this.moduleProgressRepository.findOne({
			where: { enrollmentId, moduleId },
		});

		if (!progress) {
			// Auto-create the progress record if it doesn't exist yet
			progress = await this.moduleProgressRepository.create({
				enrollmentId,
				moduleId,
				status: ProgressStatus.NOT_STARTED,
			});
		}

		const updateData: any = { ...dto };
		if (dto.status === ProgressStatus.IN_PROGRESS && !progress.startedAt) {
			updateData.startedAt = new Date();
		}
		if (dto.status === ProgressStatus.COMPLETED) {
			updateData.completedAt = new Date();
		}

		await this.moduleProgressRepository.update(
			{ moduleProgressId: progress.moduleProgressId } as any,
			updateData,
		);

		// Recalculate overall progress percent
		await this.recalculateProgress(enrollmentId);

		return this.moduleProgressRepository.findOne({
			where: { moduleProgressId: progress.moduleProgressId },
		});
	}

	// --- Waitlist ---

	async getWaitlist(cohortId: string) {
		const entries = await this.waitlistRepository
			.createQueryBuilder('waitlist')
			.where('waitlist.cohortId = :cohortId', { cohortId })
			.andWhere('waitlist.convertedToEnrollmentId IS NULL')
			.orderBy('waitlist.position', 'ASC')
			.getMany();

		return entries;
	}

	async addToWaitlist(clientId: string, cohortId: string) {
		const existing = await this.waitlistRepository.findOne({
			where: { clientId, cohortId },
		});
		if (existing && !existing.convertedToEnrollmentId) {
			throw new ConflictException('Client is already on the waitlist for this cohort');
		}

		const position = await this.getNextWaitlistPosition(cohortId);

		return this.waitlistRepository.create({
			clientId,
			cohortId,
			position,
		});
	}

	// --- Helper Methods ---

	private async initializeModuleProgress(enrollmentId: string, programId: string, selectedModuleIds: string[]) {
		const program = await this.programsService.findOne(programId);

		const modulesToTrack = selectedModuleIds.length > 0
			? program.modules.filter((m) => selectedModuleIds.includes(m.moduleId))
			: program.modules;

		for (const mod of modulesToTrack) {
			await this.moduleProgressRepository.create({
				enrollmentId,
				moduleId: mod.moduleId,
				status: ProgressStatus.NOT_STARTED,
			});
		}
	}

	private async recalculateProgress(enrollmentId: string) {
		const allProgress = await this.moduleProgressRepository
			.createQueryBuilder('progress')
			.where('progress.enrollmentId = :enrollmentId', { enrollmentId })
			.getMany();

		if (allProgress.length === 0) return;

		const completed = allProgress.filter((p) => p.status === ProgressStatus.COMPLETED).length;
		const progressPercent = (completed / allProgress.length) * 100;

		await this.enrollmentsRepository.update(
			{ enrollmentId } as any,
			{ progressPercent } as any,
		);
	}

	private async incrementCohortEnrollment(cohortId: string) {
		const cohort = await this.cohortsRepository.findOne({ where: { cohortId } });
		if (!cohort) return;

		const newCount = cohort.currentEnrollment + 1;
		const updateData: any = { currentEnrollment: newCount };

		// Auto-update cohort status to FULL if at capacity
		if (newCount >= cohort.maxCapacity && cohort.status === CohortStatus.OPEN) {
			updateData.status = CohortStatus.FULL;
		}

		await this.cohortsRepository.update({ cohortId } as any, updateData);
	}

	private async decrementCohortEnrollment(cohortId: string) {
		const cohort = await this.cohortsRepository.findOne({ where: { cohortId } });
		if (!cohort || cohort.currentEnrollment <= 0) return;

		const newCount = cohort.currentEnrollment - 1;
		const updateData: any = { currentEnrollment: newCount };

		// If was FULL, reopen to OPEN
		if (cohort.status === CohortStatus.FULL && newCount < cohort.maxCapacity) {
			updateData.status = CohortStatus.OPEN;
		}

		await this.cohortsRepository.update({ cohortId } as any, updateData);
	}

	private async updateClientStatusOnEnrollment(clientId: string) {
		const client = await this.clientsRepository.findOne({ where: { clientId } });
		if (!client) return;

		if (client.status === ClientStatus.LEAD || client.status === ClientStatus.PROSPECT) {
			await this.clientsRepository.update(
				{ clientId } as any,
				{ status: ClientStatus.ENROLLED } as any,
			);
		}
	}

	private async getNextWaitlistPosition(cohortId: string): Promise<number> {
		const lastEntry = await this.waitlistRepository
			.createQueryBuilder('waitlist')
			.where('waitlist.cohortId = :cohortId', { cohortId })
			.orderBy('waitlist.position', 'DESC')
			.getOne();

		return lastEntry ? lastEntry.position + 1 : 1;
	}

	private async notifyNextWaitlistEntry(cohortId: string) {
		const nextEntry = await this.waitlistRepository
			.createQueryBuilder('waitlist')
			.where('waitlist.cohortId = :cohortId', { cohortId })
			.andWhere('waitlist.convertedToEnrollmentId IS NULL')
			.andWhere('waitlist.notifiedAt IS NULL')
			.orderBy('waitlist.position', 'ASC')
			.getOne();

		if (nextEntry) {
			// Mark as notified with 48h deadline
			const deadline = new Date();
			deadline.setHours(deadline.getHours() + 48);

			await this.waitlistRepository.update(
				{ waitlistId: nextEntry.waitlistId } as any,
				{
					notifiedAt: new Date(),
					responseDeadline: deadline,
				} as any,
			);

			this.logger.log(`Waitlist notification sent for cohort ${cohortId}, client ${nextEntry.clientId}`);
			// TODO: Trigger actual notification via Communication module once built
		}
	}

	private async createClientPortalAccount(enrollment: any) {
		try {
			const client = await this.clientsRepository.findOne({
				where: { clientId: enrollment.clientId },
			});

			if (!client || !client.email) {
				this.logger.warn(
					`Skipping portal account creation for enrollment ${enrollment.enrollmentId}: client has no email`,
				);
				return;
			}

			// Check if a user already exists with this email
			const existingUser = await this.usersService.findByEmail(client.email);
			if (existingUser) {
				// Link existing user to client if not already linked
				if (!existingUser.linkedClientId) {
					await this.usersService.updateProfile(existingUser.userId, {});
					// Use direct update for linkedClientId since updateProfile doesn't handle it
					this.logger.log(
						`Client ${client.email} already has a user account (userId: ${existingUser.userId}). Skipping account creation.`,
					);
				}
				return;
			}

			// Generate a random temporary password
			const tempPassword = crypto.randomBytes(9).toString('base64url').slice(0, 12);

			// Create the client portal account
			await this.usersService.createClientAccount(client, tempPassword);

			// Send welcome email
			const programName = enrollment.program?.name || 'your program';
			const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
			const html = this.buildWelcomeEmailHtml(client.firstName, programName, client.email, tempPassword, frontendUrl);

			await this.emailService.sendEmail(
				client.email,
				'Welcome to iSpeak Academy — Your Portal Access',
				html,
			);

			this.logger.log(`Welcome email sent to ${client.email} for enrollment ${enrollment.enrollmentId}`);
		} catch (error) {
			// Log but don't fail the enrollment confirmation if account creation fails
			this.logger.error(
				`Failed to create portal account for enrollment ${enrollment.enrollmentId}: ${error.message}`,
				error.stack,
			);
		}
	}

	private buildWelcomeEmailHtml(
		firstName: string,
		programName: string,
		email: string,
		tempPassword: string,
		frontendUrl: string,
	): string {
		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#1a365d;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">iSpeak Academy</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px;color:#1a365d;font-size:20px;">Welcome, ${firstName}!</h2>
              <p style="margin:0 0 16px;color:#4a5568;font-size:15px;line-height:1.6;">
                Your enrollment in <strong>${programName}</strong> has been confirmed. You can now access the iSpeak Academy client portal to view your schedule, invoices, and certificates.
              </p>
              <p style="margin:0 0 8px;color:#4a5568;font-size:15px;line-height:1.6;">
                Here are your login credentials:
              </p>
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#edf2f7;border-radius:6px;margin:16px 0 24px;">
                <tr>
                  <td style="padding:20px;">
                    <p style="margin:0 0 8px;color:#2d3748;font-size:14px;"><strong>Email:</strong> ${email}</p>
                    <p style="margin:0;color:#2d3748;font-size:14px;"><strong>Temporary Password:</strong> ${tempPassword}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 24px;color:#e53e3e;font-size:14px;line-height:1.6;">
                You will be asked to set a new password on your first login.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
                <tr>
                  <td style="background-color:#2b6cb0;border-radius:6px;">
                    <a href="${frontendUrl}/login" style="display:inline-block;padding:14px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;">
                      Log In to Portal
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;background-color:#f7fafc;border-top:1px solid #e2e8f0;text-align:center;">
              <p style="margin:0;color:#a0aec0;font-size:13px;line-height:1.5;">
                If you have any questions, please contact us at
                <a href="mailto:info@ispeakacademy.org" style="color:#2b6cb0;text-decoration:none;">info@ispeakacademy.org</a>
              </p>
              <p style="margin:8px 0 0;color:#cbd5e0;font-size:12px;">&copy; ${new Date().getFullYear()} iSpeak Academy. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
	}
}
