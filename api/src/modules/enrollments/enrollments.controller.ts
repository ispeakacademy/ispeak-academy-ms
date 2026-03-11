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
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { QueryEnrollmentsDto } from './dto/query-enrollments.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { UpdateModuleProgressDto } from './dto/update-module-progress.dto';
import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
@ApiTags('Enrollments')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class EnrollmentsController {
	constructor(private readonly enrollmentsService: EnrollmentsService) {}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Create a new enrollment application' })
	async create(
		@Body() createEnrollmentDto: CreateEnrollmentDto,
		@CurrentUser() user: JwtPayload,
	) {
		const enrollment = await this.enrollmentsService.create(createEnrollmentDto, user.sub);
		return {
			success: true,
			data: enrollment,
			message: 'Enrollment application created successfully',
		};
	}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'List enrollments with filters and pagination' })
	async findAll(
		@Query() query: QueryEnrollmentsDto,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.enrollmentsService.findAll(query, user);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get an enrollment by ID' })
	async findOne(@Param('id') id: string) {
		const enrollment = await this.enrollmentsService.findOne(id);
		return {
			success: true,
			data: enrollment,
		};
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update enrollment details' })
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateEnrollmentDto,
		@CurrentUser() user: JwtPayload,
	) {
		const enrollment = await this.enrollmentsService.update(id, dto, user.sub);
		return {
			success: true,
			data: enrollment,
			message: 'Enrollment updated successfully',
		};
	}

	@Patch(':id/approve')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.APPROVE))
	@ApiOperation({ summary: 'Approve an enrollment application' })
	async approve(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		const enrollment = await this.enrollmentsService.approve(id, user.sub);
		return {
			success: true,
			data: enrollment,
			message: 'Enrollment approved successfully',
		};
	}

	@Patch(':id/reject')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.APPROVE))
	@ApiOperation({ summary: 'Reject an enrollment application' })
	async reject(
		@Param('id') id: string,
		@Body('reason') reason: string,
		@CurrentUser() user: JwtPayload,
	) {
		const enrollment = await this.enrollmentsService.reject(id, reason, user.sub);
		return {
			success: true,
			data: enrollment,
			message: 'Enrollment rejected',
		};
	}

	@Patch(':id/confirm')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Confirm enrollment (payment received)' })
	async confirm(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		const enrollment = await this.enrollmentsService.confirm(id, user.sub);
		return {
			success: true,
			data: enrollment,
			message: 'Enrollment confirmed — payment received',
		};
	}

	@Patch(':id/drop')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Drop an enrollment with reason' })
	async drop(
		@Param('id') id: string,
		@Body('reason') reason: string,
		@CurrentUser() user: JwtPayload,
	) {
		const enrollment = await this.enrollmentsService.drop(id, reason, user.sub);
		return {
			success: true,
			data: enrollment,
			message: 'Enrollment dropped',
		};
	}

	@Patch(':id/defer')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Defer enrollment to another cohort' })
	async defer(
		@Param('id') id: string,
		@Body('newCohortId') newCohortId: string,
		@CurrentUser() user: JwtPayload,
	) {
		const enrollment = await this.enrollmentsService.defer(id, newCohortId, user.sub);
		return {
			success: true,
			data: enrollment,
			message: 'Enrollment deferred to new cohort',
		};
	}

	@Post(':id/complete')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Mark enrollment as completed' })
	async complete(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		const enrollment = await this.enrollmentsService.complete(id, user.sub);
		return {
			success: true,
			data: enrollment,
			message: 'Enrollment completed — certificate generation pending',
		};
	}

	@Get(':id/progress')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get module progress for an enrollment' })
	async getProgress(@Param('id') id: string) {
		const progress = await this.enrollmentsService.getProgress(id);
		return {
			success: true,
			data: progress,
		};
	}

	@Patch(':enrollmentId/progress/:moduleId')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update module progress for an enrollment' })
	async updateModuleProgress(
		@Param('enrollmentId') enrollmentId: string,
		@Param('moduleId') moduleId: string,
		@Body() dto: UpdateModuleProgressDto,
		@CurrentUser() user: JwtPayload,
	) {
		const progress = await this.enrollmentsService.updateModuleProgress(
			enrollmentId,
			moduleId,
			dto,
			user.sub,
		);
		return {
			success: true,
			data: progress,
			message: 'Module progress updated',
		};
	}
}

// Waitlist controller
@Controller('waitlist')
@ApiTags('Waitlist')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class WaitlistController {
	constructor(private readonly enrollmentsService: EnrollmentsService) {}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Add client to waitlist for a cohort' })
	async addToWaitlist(
		@Body('clientId') clientId: string,
		@Body('cohortId') cohortId: string,
	) {
		const entry = await this.enrollmentsService.addToWaitlist(clientId, cohortId);
		return {
			success: true,
			data: entry,
			message: 'Added to waitlist',
		};
	}

	@Get('cohorts/:cohortId')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'View waitlist for a cohort' })
	async getWaitlist(@Param('cohortId') cohortId: string) {
		const entries = await this.enrollmentsService.getWaitlist(cohortId);
		return {
			success: true,
			data: entries,
		};
	}
}
