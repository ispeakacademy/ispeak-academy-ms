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
import { AssignmentsService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { QueryAssignmentsDto } from './dto/query-assignments.dto';
import { ReviewSubmissionDto } from './dto/review-submission.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

// Admin controller
@Controller('assignments')
@ApiTags('Assignments')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class AssignmentsController {
	constructor(private readonly assignmentsService: AssignmentsService) {}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Create assignment (single or bulk by cohort)' })
	async create(
		@Body() dto: CreateAssignmentDto,
		@CurrentUser() user: JwtPayload,
	) {
		const result = await this.assignmentsService.create(dto, user.sub);
		return {
			success: true,
			data: result,
			message: 'Assignment created successfully',
		};
	}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'List assignments with filters' })
	async findAll(
		@Query() query: QueryAssignmentsDto,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.assignmentsService.findAll(query, user);
	}

	@Get('enrollment/:enrollmentId')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get assignments for a specific enrollment' })
	async getByEnrollment(@Param('enrollmentId') enrollmentId: string) {
		const assignments = await this.assignmentsService.getAssignmentsByEnrollment(enrollmentId);
		return { success: true, data: assignments };
	}

	@Get('enrollment/:enrollmentId/summary')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get assignment completion summary for an enrollment' })
	async getSummary(@Param('enrollmentId') enrollmentId: string) {
		const summary = await this.assignmentsService.getAssignmentSummaryForEnrollment(enrollmentId);
		return { success: true, data: summary };
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get assignment detail with submissions' })
	async findOne(@Param('id') id: string) {
		const assignment = await this.assignmentsService.findOne(id);
		return { success: true, data: assignment };
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update an assignment' })
	async update(
		@Param('id') id: string,
		@Body() dto: UpdateAssignmentDto,
		@CurrentUser() user: JwtPayload,
	) {
		const assignment = await this.assignmentsService.update(id, dto, user.sub);
		return {
			success: true,
			data: assignment,
			message: 'Assignment updated successfully',
		};
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.DELETE))
	@ApiOperation({ summary: 'Delete an assignment (soft delete)' })
	async delete(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		await this.assignmentsService.delete(id, user.sub);
		return { success: true, message: 'Assignment deleted' };
	}

	@Patch('submissions/:id/review')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ENROLLMENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Review a submission' })
	async reviewSubmission(
		@Param('id') id: string,
		@Body() dto: ReviewSubmissionDto,
		@CurrentUser() user: JwtPayload,
	) {
		const submission = await this.assignmentsService.reviewSubmission(id, dto, user.sub);
		return {
			success: true,
			data: submission,
			message: 'Submission reviewed successfully',
		};
	}
}

// Portal controller
@Controller('portal/assignments')
@ApiTags('Portal — Assignments')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class PortalAssignmentsController {
	constructor(private readonly assignmentsService: AssignmentsService) {}

	@Get()
	@ApiOperation({ summary: 'Get my assignments (all active enrollments)' })
	async getMyAssignments(@CurrentUser() user: JwtPayload) {
		if (!user.linkedClientId) {
			return { success: true, data: [] };
		}
		const assignments = await this.assignmentsService.getMyAssignments(user.linkedClientId);
		return { success: true, data: assignments };
	}

	@Get(':id')
	@ApiOperation({ summary: 'Get a specific assignment (ownership verified)' })
	async getMyAssignment(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		const assignment = await this.assignmentsService.findOne(id);
		// Verify ownership
		if (assignment.enrollment?.clientId !== user.linkedClientId) {
			return { success: false, message: 'Access denied' };
		}
		return { success: true, data: assignment };
	}

	@Post(':id/submit')
	@ApiOperation({ summary: 'Submit or resubmit an assignment' })
	async submitAssignment(
		@Param('id') id: string,
		@Body() dto: SubmitAssignmentDto,
		@CurrentUser() user: JwtPayload,
	) {
		if (!user.linkedClientId) {
			return { success: false, message: 'No client linked' };
		}
		const submission = await this.assignmentsService.submitAssignment(id, dto, user.linkedClientId);
		return {
			success: true,
			data: submission,
			message: 'Assignment submitted successfully',
		};
	}
}
