import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { CohortStatus } from '@/common/enums/cohort-status.enum';
import { SessionStatus } from '@/common/enums/session-status.enum';
import {
	BadRequestException,
	ConflictException,
	Injectable,
	Logger,
	NotFoundException,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { ProgramsService } from '../programs/programs.service';
import { AttendanceRepository } from './attendance.repository';
import { CohortsRepository } from './cohorts.repository';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { QueryCohortsDto } from './dto/query-cohorts.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { SessionsRepository } from './sessions.repository';

@Injectable()
export class CohortsService {
	private readonly logger = new Logger(CohortsService.name);

	constructor(
		private readonly cohortsRepository: CohortsRepository,
		private readonly sessionsRepository: SessionsRepository,
		private readonly attendanceRepository: AttendanceRepository,
		private readonly programsService: ProgramsService,
		private readonly auditService: AuditService,
	) {}

	// --- Cohort CRUD ---

	async create(dto: CreateCohortDto, employeeId: string) {
		// Verify program exists
		await this.programsService.findOne(dto.programId);

		// Check for duplicate batchCode
		const existingByCode = await this.cohortsRepository.findOne({
			where: { batchCode: dto.batchCode },
		});
		if (existingByCode) {
			throw new ConflictException(`A cohort with batch code "${dto.batchCode}" already exists`);
		}

		const cohort = await this.cohortsRepository.create({
			...dto,
			startDate: new Date(dto.startDate),
			endDate: new Date(dto.endDate),
			status: dto.status || CohortStatus.DRAFT,
		});

		await this.auditService.createLog({
			action: AuditAction.COHORT_CREATED,
			performedBy: employeeId,
			targetType: AuditTargetType.COHORT,
			targetId: cohort.cohortId,
			details: `Cohort created: ${cohort.name} (${cohort.batchCode})`,
		});

		this.logger.log(`Cohort created: ${cohort.cohortId} by employee: ${employeeId}`);

		return cohort;
	}

	async findAll(query: QueryCohortsDto) {
		const { page = 1, limit = 20, programId, status, search } = query;
		const skip = (page - 1) * limit;

		const queryBuilder = this.cohortsRepository
			.createQueryBuilder('cohort')
			.leftJoinAndSelect('cohort.program', 'program')
			.where('cohort.deletedAt IS NULL')
			.orderBy('cohort.startDate', 'DESC')
			.skip(skip)
			.take(limit);

		if (programId) {
			queryBuilder.andWhere('cohort.programId = :programId', { programId });
		}

		if (status) {
			queryBuilder.andWhere('cohort.status = :status', { status });
		}

		if (search) {
			queryBuilder.andWhere(
				'(cohort.name ILIKE :search OR cohort.batchCode ILIKE :search)',
				{ search: `%${search}%` },
			);
		}

		const [cohorts, total] = await queryBuilder.getManyAndCount();

		return {
			data: cohorts,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(cohortId: string) {
		const cohort = await this.cohortsRepository.findOne({
			where: { cohortId },
			relations: ['program', 'sessions'],
		});

		if (!cohort) {
			throw new NotFoundException(`Cohort with ID ${cohortId} not found`);
		}

		return cohort;
	}

	async update(cohortId: string, dto: UpdateCohortDto, employeeId: string) {
		const cohort = await this.findOne(cohortId);

		// If updating batchCode, check for duplicates
		if (dto.batchCode && dto.batchCode !== cohort.batchCode) {
			const existingByCode = await this.cohortsRepository.findOne({
				where: { batchCode: dto.batchCode },
			});
			if (existingByCode && existingByCode.cohortId !== cohortId) {
				throw new ConflictException(`A cohort with batch code "${dto.batchCode}" already exists`);
			}
		}

		const updateData: any = { ...dto };
		if (dto.startDate) updateData.startDate = new Date(dto.startDate);
		if (dto.endDate) updateData.endDate = new Date(dto.endDate);

		// Track status changes
		const statusChanged = dto.status && dto.status !== cohort.status;

		const updatedCohort = await this.cohortsRepository.update(
			{ cohortId } as any,
			updateData,
		);

		const action = statusChanged ? AuditAction.COHORT_STATUS_CHANGED : AuditAction.COHORT_UPDATED;
		await this.auditService.createLog({
			action,
			performedBy: employeeId,
			targetType: AuditTargetType.COHORT,
			targetId: cohortId,
			details: statusChanged
				? `Cohort status changed from ${cohort.status} to ${dto.status}: ${cohort.name}`
				: `Cohort updated: ${cohort.name}`,
			metadata: statusChanged
				? { previousStatus: cohort.status, newStatus: dto.status }
				: { updatedFields: Object.keys(dto) },
		});

		this.logger.log(`Cohort updated: ${cohortId} by employee: ${employeeId}`);

		return updatedCohort;
	}

	async softDelete(cohortId: string, employeeId: string) {
		const cohort = await this.findOne(cohortId);

		const queryBuilder = this.cohortsRepository.createQueryBuilder('cohort');
		await queryBuilder
			.softDelete()
			.where('cohort_id = :cohortId', { cohortId })
			.execute();

		await this.auditService.createLog({
			action: AuditAction.COHORT_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.COHORT,
			targetId: cohortId,
			details: `Cohort archived: ${cohort.name} (${cohort.batchCode})`,
		});

		this.logger.log(`Cohort soft-deleted: ${cohortId} by employee: ${employeeId}`);

		return { message: 'Cohort archived successfully' };
	}

	// --- Session Management ---

	async addSession(cohortId: string, dto: CreateSessionDto, employeeId: string) {
		const cohort = await this.findOne(cohortId);

		const session = await this.sessionsRepository.create({
			...dto,
			cohortId,
			scheduledAt: new Date(dto.scheduledAt),
		});

		await this.auditService.createLog({
			action: AuditAction.COHORT_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.SESSION,
			targetId: session.sessionId,
			details: `Session added to cohort ${cohort.batchCode}: ${dto.title}`,
			metadata: { cohortId },
		});

		this.logger.log(`Session created: ${session.sessionId} for cohort: ${cohortId}`);

		return session;
	}

	async getSessionsForClient(clientId: string) {
		// Get sessions from cohorts where the client has active enrollments
		const sessions = await this.sessionsRepository
			.createQueryBuilder('session')
			.innerJoin('session.cohort', 'cohort')
			.where(
				`session.cohort_id IN (
					SELECT e.cohort_id FROM enrollments e
					WHERE e.client_id = :clientId
					AND e.deleted_at IS NULL
					AND e.status IN ('confirmed', 'active')
				)`,
				{ clientId },
			)
			.andWhere('session.status != :cancelled', { cancelled: SessionStatus.CANCELLED })
			.orderBy('session.scheduledAt', 'ASC')
			.getMany();

		return sessions;
	}

	async getSessions(cohortId: string) {
		await this.findOne(cohortId);

		const sessions = await this.sessionsRepository
			.createQueryBuilder('session')
			.where('session.cohortId = :cohortId', { cohortId })
			.orderBy('session.scheduledAt', 'ASC')
			.getMany();

		return sessions;
	}

	async getSession(sessionId: string) {
		const session = await this.sessionsRepository.findOne({
			where: { sessionId },
			relations: ['cohort', 'attendance'],
		});

		if (!session) {
			throw new NotFoundException(`Session with ID ${sessionId} not found`);
		}

		return session;
	}

	async updateSession(sessionId: string, dto: UpdateSessionDto, employeeId: string) {
		const session = await this.getSession(sessionId);

		const updateData: any = { ...dto };
		if (dto.scheduledAt) updateData.scheduledAt = new Date(dto.scheduledAt);

		const updatedSession = await this.sessionsRepository.update(
			{ sessionId } as any,
			updateData,
		);

		await this.auditService.createLog({
			action: AuditAction.COHORT_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.SESSION,
			targetId: sessionId,
			details: `Session updated: ${session.title}`,
			metadata: { cohortId: session.cohortId, updatedFields: Object.keys(dto) },
		});

		return updatedSession;
	}

	async cancelSession(sessionId: string, reason: string, employeeId: string) {
		const session = await this.getSession(sessionId);

		if (session.status === SessionStatus.CANCELLED) {
			throw new BadRequestException('Session is already cancelled');
		}

		await this.sessionsRepository.update(
			{ sessionId } as any,
			{ status: SessionStatus.CANCELLED, cancelReason: reason } as any,
		);

		await this.auditService.createLog({
			action: AuditAction.COHORT_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.SESSION,
			targetId: sessionId,
			details: `Session cancelled: ${session.title} — Reason: ${reason}`,
			metadata: { cohortId: session.cohortId },
		});

		this.logger.log(`Session cancelled: ${sessionId} by employee: ${employeeId}`);

		return { message: 'Session cancelled successfully' };
	}

	async completeSession(sessionId: string, recordingUrl: string | undefined, employeeId: string) {
		const session = await this.getSession(sessionId);

		if (session.status === SessionStatus.COMPLETED) {
			throw new BadRequestException('Session is already completed');
		}

		const updateData: any = { status: SessionStatus.COMPLETED };
		if (recordingUrl) updateData.recordingUrl = recordingUrl;

		await this.sessionsRepository.update(
			{ sessionId } as any,
			updateData,
		);

		await this.auditService.createLog({
			action: AuditAction.COHORT_UPDATED,
			performedBy: employeeId,
			targetType: AuditTargetType.SESSION,
			targetId: sessionId,
			details: `Session marked complete: ${session.title}`,
			metadata: { cohortId: session.cohortId },
		});

		this.logger.log(`Session completed: ${sessionId} by employee: ${employeeId}`);

		return { message: 'Session marked as completed' };
	}

	// --- Attendance ---

	async markAttendance(sessionId: string, dto: MarkAttendanceDto, employeeId: string) {
		const session = await this.getSession(sessionId);

		const records = [];
		for (const entry of dto.entries) {
			// Upsert — check if attendance exists for this session+enrollment
			const existing = await this.attendanceRepository.findOne({
				where: { sessionId, enrollmentId: entry.enrollmentId },
			});

			if (existing) {
				await this.attendanceRepository.update(
					{ attendanceId: existing.attendanceId } as any,
					{
						status: entry.status,
						joinedAt: entry.joinedAt ? new Date(entry.joinedAt) : existing.joinedAt,
						leftAt: entry.leftAt ? new Date(entry.leftAt) : existing.leftAt,
						minutesAttended: entry.minutesAttended ?? existing.minutesAttended,
						markedByEmployeeId: employeeId,
						notes: entry.notes ?? existing.notes,
					} as any,
				);
				records.push({ ...existing, ...entry });
			} else {
				const record = await this.attendanceRepository.create({
					sessionId,
					enrollmentId: entry.enrollmentId,
					clientId: entry.clientId,
					status: entry.status,
					joinedAt: entry.joinedAt ? new Date(entry.joinedAt) : undefined,
					leftAt: entry.leftAt ? new Date(entry.leftAt) : undefined,
					minutesAttended: entry.minutesAttended,
					markedByEmployeeId: employeeId,
					notes: entry.notes,
				});
				records.push(record);
			}
		}

		this.logger.log(`Attendance marked for session ${sessionId}: ${dto.entries.length} entries`);

		return { message: `Attendance recorded for ${dto.entries.length} students`, count: dto.entries.length };
	}

	async getAttendance(sessionId: string) {
		await this.getSession(sessionId);

		const attendance = await this.attendanceRepository
			.createQueryBuilder('attendance')
			.where('attendance.sessionId = :sessionId', { sessionId })
			.orderBy('attendance.createdAt', 'ASC')
			.getMany();

		return attendance;
	}

	async getAttendanceSummary(cohortId: string) {
		await this.findOne(cohortId);

		const sessions = await this.sessionsRepository
			.createQueryBuilder('session')
			.where('session.cohortId = :cohortId', { cohortId })
			.andWhere('session.status = :status', { status: SessionStatus.COMPLETED })
			.getMany();

		const sessionIds = sessions.map((s) => s.sessionId);

		if (sessionIds.length === 0) {
			return { totalSessions: 0, attendanceData: [] };
		}

		const attendanceRecords = await this.attendanceRepository
			.createQueryBuilder('attendance')
			.where('attendance.sessionId IN (:...sessionIds)', { sessionIds })
			.getMany();

		// Group by enrollment
		const byEnrollment = new Map<string, { present: number; absent: number; excused: number; late: number }>();
		for (const record of attendanceRecords) {
			if (!byEnrollment.has(record.enrollmentId)) {
				byEnrollment.set(record.enrollmentId, { present: 0, absent: 0, excused: 0, late: 0 });
			}
			const stats = byEnrollment.get(record.enrollmentId);
			stats[record.status]++;
		}

		const attendanceData = Array.from(byEnrollment.entries()).map(([enrollmentId, stats]) => ({
			enrollmentId,
			...stats,
			total: stats.present + stats.absent + stats.excused + stats.late,
			attendanceRate: ((stats.present + stats.late) / (stats.present + stats.absent + stats.excused + stats.late)) * 100,
		}));

		return {
			totalSessions: sessions.length,
			attendanceData,
		};
	}
}
