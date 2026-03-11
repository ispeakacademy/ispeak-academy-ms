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
	Controller,
	Get,
	ParseIntPipe,
	Query,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiQuery,
	ApiResponse,
	ApiSecurity,
	ApiTags,
} from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
@ApiTags('Dashboard')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DashboardController {
	constructor(private readonly dashboardService: DashboardService) {}

	@Get('overview')
	@RequirePermissions(Permission(PermissionResource.DASHBOARD, PermissionAction.READ))
	@ApiOperation({ summary: 'Get overview KPIs for the admin dashboard' })
	@ApiResponse({ status: 200, description: 'Overview KPIs retrieved successfully' })
	async getOverviewKPIs() {
		const data = await this.dashboardService.getOverviewKPIs();
		return {
			success: true,
			data,
		};
	}

	@Get('enrollment-stats')
	@RequirePermissions(Permission(PermissionResource.DASHBOARD, PermissionAction.READ))
	@ApiOperation({ summary: 'Get enrollment statistics with monthly comparison' })
	@ApiResponse({ status: 200, description: 'Enrollment stats retrieved successfully' })
	async getEnrollmentStats() {
		const data = await this.dashboardService.getEnrollmentStats();
		return {
			success: true,
			data,
		};
	}

	@Get('revenue-stats')
	@RequirePermissions(Permission(PermissionResource.DASHBOARD, PermissionAction.READ))
	@ApiOperation({ summary: 'Get revenue statistics and collection rate' })
	@ApiResponse({ status: 200, description: 'Revenue stats retrieved successfully' })
	async getRevenueStats() {
		const data = await this.dashboardService.getRevenueStats();
		return {
			success: true,
			data,
		};
	}

	@Get('recent-activity')
	@RequirePermissions(Permission(PermissionResource.DASHBOARD, PermissionAction.READ))
	@ApiOperation({ summary: 'Get recent activity across enrollments, payments, and communications' })
	@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of recent items to return (default: 10, max: 50)' })
	@ApiResponse({ status: 200, description: 'Recent activity retrieved successfully' })
	async getRecentActivity(
		@Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
	) {
		const data = await this.dashboardService.getRecentActivity(limit ?? 10);
		return {
			success: true,
			data,
		};
	}

	@Get('program-performance')
	@RequirePermissions(Permission(PermissionResource.DASHBOARD, PermissionAction.READ))
	@ApiOperation({ summary: 'Get performance metrics per active program' })
	@ApiResponse({ status: 200, description: 'Program performance data retrieved successfully' })
	async getProgramPerformance() {
		const data = await this.dashboardService.getProgramPerformance();
		return {
			success: true,
			data,
		};
	}

	@Get('cohort-summary')
	@RequirePermissions(Permission(PermissionResource.DASHBOARD, PermissionAction.READ))
	@ApiOperation({ summary: 'Get summary of active cohorts with fill rates' })
	@ApiResponse({ status: 200, description: 'Cohort summary retrieved successfully' })
	async getCohortSummary() {
		const data = await this.dashboardService.getCohortSummary();
		return {
			success: true,
			data,
		};
	}
}
