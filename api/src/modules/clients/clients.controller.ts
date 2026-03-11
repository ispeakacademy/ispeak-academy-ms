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
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { QueryClientsDto } from './dto/query-clients.dto';
import { UpdateClientDto } from './dto/update-client.dto';

@Controller('clients')
@ApiTags('Clients')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class ClientsController {
	constructor(private readonly clientsService: ClientsService) {}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Create a new client' })
	async create(
		@Body() createClientDto: CreateClientDto,
		@CurrentUser() user: JwtPayload,
	) {
		const client = await this.clientsService.create(createClientDto, user.sub);
		return {
			success: true,
			data: client,
			message: 'Client created successfully',
		};
	}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'List clients with filters and pagination' })
	async findAll(
		@Query() query: QueryClientsDto,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.clientsService.findAll(query, user);
	}

	@Get('search')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Full-text search clients by name, email, or phone' })
	async search(@Query('q') q: string) {
		return await this.clientsService.search(q);
	}

	@Get('my-referrals')
	@UseGuards(JwtAuthGuard)
	@ApiOperation({ summary: 'Get referrals made by the current client (portal)' })
	async getMyReferrals(@CurrentUser() user: JwtPayload) {
		if (!user.linkedClientId) {
			return { success: true, data: [], total: 0 };
		}
		return await this.clientsService.getReferrals(user.linkedClientId);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get a client by ID' })
	async findOne(@Param('id') id: string) {
		const client = await this.clientsService.findOne(id);
		return {
			success: true,
			data: client,
		};
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update a client' })
	async update(
		@Param('id') id: string,
		@Body() updateClientDto: UpdateClientDto,
		@CurrentUser() user: JwtPayload,
	) {
		const client = await this.clientsService.update(id, updateClientDto, user.sub);
		return {
			success: true,
			data: client,
			message: 'Client updated successfully',
		};
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.DELETE))
	@ApiOperation({ summary: 'Soft delete (archive) a client' })
	async softDelete(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.clientsService.softDelete(id, user.sub);
	}

	@Post(':id/interactions')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Add an interaction to a client' })
	async addInteraction(
		@Param('id') id: string,
		@Body() createInteractionDto: CreateInteractionDto,
		@CurrentUser() user: JwtPayload,
	) {
		const interaction = await this.clientsService.addInteraction(
			id,
			createInteractionDto,
			user.sub,
		);
		return {
			success: true,
			data: interaction,
			message: 'Interaction added successfully',
		};
	}

	@Get(':id/interactions')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get paginated interactions for a client' })
	async getInteractions(
		@Param('id') id: string,
		@Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
	) {
		return await this.clientsService.getInteractions(id, page, limit);
	}

	@Get(':id/timeline')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get combined timeline of client activities' })
	async getTimeline(@Param('id') id: string) {
		const timeline = await this.clientsService.getTimeline(id);
		return {
			success: true,
			data: timeline,
		};
	}

	@Get(':id/enrollments')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get client enrollment history' })
	async getEnrollments(
		@Param('id') id: string,
		@Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
	) {
		return await this.clientsService.getEnrollments(id, page, limit);
	}

	@Get(':id/invoices')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get client invoice history' })
	async getInvoices(
		@Param('id') id: string,
		@Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
	) {
		return await this.clientsService.getInvoices(id, page, limit);
	}

	@Get(':id/referrals')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get clients referred by this client' })
	async getReferrals(@Param('id') id: string) {
		return await this.clientsService.getReferrals(id);
	}

	@Post(':id/assign')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Assign client to an employee (account owner)' })
	async assign(
		@Param('id') id: string,
		@Body('employeeId') employeeId: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.clientsService.assignToEmployee(id, employeeId, user.sub);
	}

	@Post(':id/convert-to-prospect')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Convert a lead to prospect status' })
	async convertToProspect(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.clientsService.convertToProspect(id, user.sub);
	}

	@Post(':id/send-portal-invite')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.CLIENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Send or resend portal invite to client' })
	async sendPortalInvite(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.clientsService.sendPortalInvite(id, user.sub);
	}
}
