import {
	Body,
	ClassSerializerInterceptor,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UseGuards,
	UseInterceptors,
} from '@nestjs/common';
import { ApiBearerAuth, ApiSecurity } from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { CreateAvailabilityBlockDto } from './dto/create-availability-block.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { QueryEmployeesDto } from './dto/query-employees.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { EmployeesService } from './employees.service';

@Controller('employees')
@UseInterceptors(ClassSerializerInterceptor)
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class EmployeesController {
	constructor(private readonly employeesService: EmployeesService) {}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async create(
		@Body() createEmployeeDto: CreateEmployeeDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.employeesService.create(createEmployeeDto, user.sub);
	}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async findAll(@Query() query: QueryEmployeesDto) {
		return this.employeesService.findAll(query);
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	async getMyProfile(@CurrentUser() user: JwtPayload) {
		return this.employeesService.findByLinkedUserId(user.sub);
	}

	@Patch('me')
	@UseGuards(JwtAuthGuard)
	async updateMyProfile(
		@CurrentUser() user: JwtPayload,
		@Body() dto: UpdateEmployeeDto,
	) {
		return this.employeesService.updateOwnProfile(user.sub, dto);
	}

	@Get('available')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async getAvailableTrainers(@Query('date') date: string) {
		return this.employeesService.getAvailableTrainers(date);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async findOne(@Param('id') id: string) {
		return this.employeesService.findOne(id);
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async update(
		@Param('id') id: string,
		@Body() updateEmployeeDto: UpdateEmployeeDto,
		@CurrentUser() user: JwtPayload,
	) {
		return this.employeesService.update(id, updateEmployeeDto, user.sub);
	}

	@Patch(':id/role')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async updateRole(
		@Param('id') id: string,
		@Body('roleId') roleId: string,
		@CurrentUser() user: JwtPayload,
	) {
		return this.employeesService.updateRole(id, roleId, user.sub);
	}

	@Post(':id/deactivate')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async deactivate(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		return this.employeesService.deactivate(id, user.sub);
	}

	@Get(':id/sessions')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async getAssignedSessions(
		@Param('id') id: string,
		@Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
	) {
		return this.employeesService.getAssignedSessions(id, { page, limit });
	}

	@Get(':id/cohorts')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async getAssignedCohorts(@Param('id') id: string) {
		return this.employeesService.getAssignedCohorts(id);
	}

	@Get(':id/workload')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async getWorkload(
		@Param('id') id: string,
		@Query('month') month?: string,
	) {
		return this.employeesService.getWorkload(id, month);
	}

	@Post(':id/availability-blocks')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async addAvailabilityBlock(
		@Param('id') id: string,
		@Body() dto: CreateAvailabilityBlockDto,
	) {
		return this.employeesService.addAvailabilityBlock(id, dto);
	}

	@Get(':id/availability-blocks')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async getAvailabilityBlocks(@Param('id') id: string) {
		return this.employeesService.getAvailabilityBlocks(id);
	}

	@Delete(':id/availability-blocks/:blockId')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	async deleteAvailabilityBlock(
		@Param('id') id: string,
		@Param('blockId') blockId: string,
	) {
		await this.employeesService.deleteAvailabilityBlock(id, blockId);
		return { success: true, message: 'Availability block removed' };
	}
}
