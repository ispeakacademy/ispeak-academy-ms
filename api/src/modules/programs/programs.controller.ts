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
import { CreateProgramDto } from './dto/create-program.dto';
import { CreateProgramModuleDto } from './dto/create-program-module.dto';
import { QueryProgramsDto } from './dto/query-programs.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { UpdateProgramModuleDto } from './dto/update-program-module.dto';
import { ProgramsService } from './programs.service';

@Controller('programs')
@ApiTags('Programs')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class ProgramsController {
	constructor(private readonly programsService: ProgramsService) {}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Create a new program' })
	async create(
		@Body() createProgramDto: CreateProgramDto,
		@CurrentUser() user: JwtPayload,
	) {
		const program = await this.programsService.create(createProgramDto, user.sub);
		return {
			success: true,
			data: program,
			message: 'Program created successfully',
		};
	}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.READ))
	@ApiOperation({ summary: 'List programs with filters and pagination' })
	async findAll(
		@Query() query: QueryProgramsDto,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.programsService.findAll(query, user);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get a program by ID with its modules' })
	async findOne(@Param('id') id: string) {
		const program = await this.programsService.findOne(id);
		return {
			success: true,
			data: program,
		};
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update a program' })
	async update(
		@Param('id') id: string,
		@Body() updateProgramDto: UpdateProgramDto,
		@CurrentUser() user: JwtPayload,
	) {
		const program = await this.programsService.update(id, updateProgramDto, user.sub);
		return {
			success: true,
			data: program,
			message: 'Program updated successfully',
		};
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.DELETE))
	@ApiOperation({ summary: 'Soft delete (archive) a program' })
	async softDelete(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.programsService.softDelete(id, user.sub);
	}

	@Patch(':id/trainers')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Assign trainers to a program' })
	async updateTrainers(
		@Param('id') id: string,
		@Body('trainerIds') trainerIds: string[],
		@CurrentUser() user: JwtPayload,
	) {
		const program = await this.programsService.updateTrainers(id, trainerIds, user.sub);
		return {
			success: true,
			data: program,
			message: 'Program trainers updated successfully',
		};
	}

	// --- Program Module Endpoints ---

	@Post(':id/modules')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Add a module to a program' })
	async addModule(
		@Param('id') id: string,
		@Body() createModuleDto: CreateProgramModuleDto,
		@CurrentUser() user: JwtPayload,
	) {
		const module = await this.programsService.addModule(id, createModuleDto, user.sub);
		return {
			success: true,
			data: module,
			message: 'Module added successfully',
		};
	}

	@Get(':id/modules')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get all modules for a program' })
	async getModules(@Param('id') id: string) {
		const modules = await this.programsService.getModules(id);
		return {
			success: true,
			data: modules,
		};
	}

	@Patch(':id/modules/:moduleId')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update a module in a program' })
	async updateModule(
		@Param('id') id: string,
		@Param('moduleId') moduleId: string,
		@Body() updateModuleDto: UpdateProgramModuleDto,
		@CurrentUser() user: JwtPayload,
	) {
		const module = await this.programsService.updateModule(id, moduleId, updateModuleDto, user.sub);
		return {
			success: true,
			data: module,
			message: 'Module updated successfully',
		};
	}

	@Delete(':id/modules/:moduleId')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PROGRAMS, PermissionAction.DELETE))
	@ApiOperation({ summary: 'Remove a module from a program' })
	async removeModule(
		@Param('id') id: string,
		@Param('moduleId') moduleId: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.programsService.removeModule(id, moduleId, user.sub);
	}
}
