import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
	Permission,
	RequirePermissions,
} from '@/common/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import {
	PermissionAction,
	PermissionResource,
} from '@/modules/permissions/entities/permission.entity';
import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CohortsService } from './cohorts.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { CreateSessionDto } from './dto/create-session.dto';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
import { QueryCohortsDto } from './dto/query-cohorts.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Controller('cohorts')
@ApiTags('Cohorts')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class CohortsController {
	constructor(private readonly cohortsService: CohortsService) {}

	// --- Cohort Endpoints ---

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Create a new cohort' })
	async create(
		@Body() createCohortDto: CreateCohortDto,
		@CurrentUser() user: JwtPayload,
	) {
		const cohort = await this.cohortsService.create(createCohortDto, user.sub);
		return {
			success: true,
			data: cohort,
			message: 'Cohort created successfully',
		};
	}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.READ))
	@ApiOperation({ summary: 'List cohorts with filters and pagination' })
	async findAll(@Query() query: QueryCohortsDto) {
		return await this.cohortsService.findAll(query);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get a cohort by ID with sessions' })
	async findOne(@Param('id') id: string) {
		const cohort = await this.cohortsService.findOne(id);
		return {
			success: true,
			data: cohort,
		};
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update a cohort' })
	async update(
		@Param('id') id: string,
		@Body() updateCohortDto: UpdateCohortDto,
		@CurrentUser() user: JwtPayload,
	) {
		const cohort = await this.cohortsService.update(id, updateCohortDto, user.sub);
		return {
			success: true,
			data: cohort,
			message: 'Cohort updated successfully',
		};
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.DELETE))
	@ApiOperation({ summary: 'Soft delete (archive) a cohort' })
	async softDelete(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.cohortsService.softDelete(id, user.sub);
	}

	// --- Session Endpoints ---

	@Post(':id/sessions')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Add a session to a cohort' })
	async addSession(
		@Param('id') id: string,
		@Body() createSessionDto: CreateSessionDto,
		@CurrentUser() user: JwtPayload,
	) {
		const session = await this.cohortsService.addSession(id, createSessionDto, user.sub);
		return {
			success: true,
			data: session,
			message: 'Session added successfully',
		};
	}

	@Get(':id/sessions')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.READ))
	@ApiOperation({ summary: 'List sessions for a cohort' })
	async getSessions(@Param('id') id: string) {
		const sessions = await this.cohortsService.getSessions(id);
		return {
			success: true,
			data: sessions,
		};
	}

	@Get(':id/attendance-summary')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get attendance summary for a cohort' })
	async getAttendanceSummary(@Param('id') id: string) {
		const summary = await this.cohortsService.getAttendanceSummary(id);
		return {
			success: true,
			data: summary,
		};
	}
}

// Separate controller for session-level endpoints
@Controller('sessions')
@ApiTags('Sessions')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class SessionsController {
	constructor(private readonly cohortsService: CohortsService) {}

	@Get()
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'List sessions (own=true for portal client sessions)' })
	async listSessions(
		@Query('own') own: string,
		@CurrentUser() user: JwtPayload,
	) {
		if (own === 'true' && user.linkedClientId) {
			const sessions = await this.cohortsService.getSessionsForClient(user.linkedClientId);
			return { success: true, data: sessions };
		}
		// Non-portal users without own=true get nothing from this endpoint;
		// admin session listing is via GET /cohorts/:id/sessions
		return { success: true, data: [] };
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get a session by ID' })
	async getSession(@Param('id') id: string) {
		const session = await this.cohortsService.getSession(id);
		return {
			success: true,
			data: session,
		};
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update a session' })
	async updateSession(
		@Param('id') id: string,
		@Body() updateSessionDto: UpdateSessionDto,
		@CurrentUser() user: JwtPayload,
	) {
		const session = await this.cohortsService.updateSession(id, updateSessionDto, user.sub);
		return {
			success: true,
			data: session,
			message: 'Session updated successfully',
		};
	}

	@Post(':id/cancel')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Cancel a session with reason' })
	async cancelSession(
		@Param('id') id: string,
		@Body('reason') reason: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.cohortsService.cancelSession(id, reason, user.sub);
	}

	@Post(':id/complete')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Mark session as completed with optional recording URL' })
	async completeSession(
		@Param('id') id: string,
		@Body('recordingUrl') recordingUrl: string | undefined,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.cohortsService.completeSession(id, recordingUrl, user.sub);
	}

	@Post(':id/attendance')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Mark attendance for a session (bulk)' })
	async markAttendance(
		@Param('id') id: string,
		@Body() markAttendanceDto: MarkAttendanceDto,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.cohortsService.markAttendance(id, markAttendanceDto, user.sub);
	}

	@Get(':id/attendance')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COHORTS, PermissionAction.READ))
	@ApiOperation({ summary: 'View attendance for a session' })
	async getAttendance(@Param('id') id: string) {
		const attendance = await this.cohortsService.getAttendance(id);
		return {
			success: true,
			data: attendance,
		};
	}
}
