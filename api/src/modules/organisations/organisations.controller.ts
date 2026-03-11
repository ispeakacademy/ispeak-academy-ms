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
	ParseIntPipe,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CreateOrganisationDto } from './dto/create-organisation.dto';
import { UpdateOrganisationDto } from './dto/update-organisation.dto';
import { OrganisationsService } from './organisations.service';

@Controller('organisations')
@ApiTags('Organisations')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class OrganisationsController {
	constructor(private readonly organisationsService: OrganisationsService) {}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ORGANISATIONS, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Create a new organisation' })
	async create(
		@Body() createOrganisationDto: CreateOrganisationDto,
		@CurrentUser() user: JwtPayload,
	) {
		const organisation = await this.organisationsService.create(createOrganisationDto, user.sub);
		return {
			success: true,
			data: organisation,
			message: 'Organisation created successfully',
		};
	}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ORGANISATIONS, PermissionAction.READ))
	@ApiOperation({ summary: 'List organisations with pagination and search' })
	async findAll(
		@Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
		@Query('search') search?: string,
	) {
		return await this.organisationsService.findAll(page, limit, search);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ORGANISATIONS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get an organisation by ID' })
	async findOne(@Param('id') id: string) {
		const organisation = await this.organisationsService.findOne(id);
		return {
			success: true,
			data: organisation,
		};
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ORGANISATIONS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update an organisation' })
	async update(
		@Param('id') id: string,
		@Body() updateOrganisationDto: UpdateOrganisationDto,
		@CurrentUser() user: JwtPayload,
	) {
		const organisation = await this.organisationsService.update(id, updateOrganisationDto, user.sub);
		return {
			success: true,
			data: organisation,
			message: 'Organisation updated successfully',
		};
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ORGANISATIONS, PermissionAction.DELETE))
	@ApiOperation({ summary: 'Soft delete (archive) an organisation' })
	async softDelete(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.organisationsService.softDelete(id, user.sub);
	}

	@Get(':id/contacts')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ORGANISATIONS, PermissionAction.READ))
	@ApiOperation({ summary: 'List contacts for an organisation' })
	async getContacts(
		@Param('id') id: string,
		@Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
	) {
		return await this.organisationsService.getContacts(id, page, limit);
	}

	@Get(':id/invoices')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.ORGANISATIONS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get consolidated billing view for an organisation' })
	async getInvoices(
		@Param('id') id: string,
		@Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
	) {
		return await this.organisationsService.getInvoices(id, page, limit);
	}
}
