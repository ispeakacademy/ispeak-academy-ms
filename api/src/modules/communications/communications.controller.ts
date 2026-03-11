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
import { CommunicationsService } from './communications.service';
import { CreateTemplateDto } from './dto/create-template.dto';
import { PreviewAudienceDto } from './dto/preview-audience.dto';
import { QueryCommunicationsDto } from './dto/query-communications.dto';
import { SendBulkMessageDto } from './dto/send-bulk-message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';

// ─── Communications Controller ─────────────────────────────────────────

@Controller('communications')
@ApiTags('Communications')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class CommunicationsController {
	constructor(private readonly communicationsService: CommunicationsService) {}

	@Post('send')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COMMUNICATIONS, PermissionAction.SEND))
	@ApiOperation({ summary: 'Send a message to a client' })
	async sendMessage(
		@Body() dto: SendMessageDto,
		@CurrentUser() user: JwtPayload,
	) {
		const communication = await this.communicationsService.sendMessage(dto, user.sub);
		return {
			success: true,
			data: communication,
			message: 'Message sent successfully',
		};
	}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COMMUNICATIONS, PermissionAction.READ))
	@ApiOperation({ summary: 'List communications with filters and pagination' })
	async findAll(@Query() query: QueryCommunicationsDto) {
		return await this.communicationsService.findAll(query);
	}

	@Post('send-bulk')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COMMUNICATIONS, PermissionAction.SEND))
	@ApiOperation({ summary: 'Send a message to multiple clients (bulk/broadcast)' })
	async sendBulkMessage(
		@Body() dto: SendBulkMessageDto,
		@CurrentUser() user: JwtPayload,
	) {
		const result = await this.communicationsService.sendBulkMessage(dto, user.sub);
		return {
			success: true,
			data: result,
			message: `Bulk message sent: ${result.sentCount} delivered, ${result.failedCount} failed`,
		};
	}

	@Post('preview-audience')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COMMUNICATIONS, PermissionAction.READ))
	@ApiOperation({ summary: 'Preview audience count for bulk message targeting' })
	async previewAudience(
		@Body() dto: PreviewAudienceDto,
	) {
		const result = await this.communicationsService.previewAudience(dto);
		return {
			success: true,
			data: result,
		};
	}

	@Get('inbox')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COMMUNICATIONS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get inbound messages (staff inbox)' })
	async getInbox(
		@Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
		@Query('limit', new ParseIntPipe({ optional: true })) limit: number = 20,
	) {
		return await this.communicationsService.getInbox(page, limit);
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COMMUNICATIONS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get communication detail by ID' })
	async findOne(@Param('id') id: string) {
		const communication = await this.communicationsService.findOne(id);
		return {
			success: true,
			data: communication,
		};
	}

	@Post(':id/reply')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.COMMUNICATIONS, PermissionAction.SEND))
	@ApiOperation({ summary: 'Reply to a message' })
	async replyToMessage(
		@Param('id') id: string,
		@Body('body') body: string,
		@CurrentUser() user: JwtPayload,
	) {
		const reply = await this.communicationsService.replyToMessage(id, body, user.sub);
		return {
			success: true,
			data: reply,
			message: 'Reply sent successfully',
		};
	}
}

// ─── Templates Controller ───────────────────────────────────────────────

@Controller('templates')
@ApiTags('Templates')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class TemplatesController {
	constructor(private readonly communicationsService: CommunicationsService) {}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.TEMPLATES, PermissionAction.READ))
	@ApiOperation({ summary: 'List all message templates' })
	async findAllTemplates() {
		const templates = await this.communicationsService.findAllTemplates();
		return {
			success: true,
			data: templates,
		};
	}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.TEMPLATES, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Create a new message template' })
	async createTemplate(
		@Body() dto: CreateTemplateDto,
		@CurrentUser() user: JwtPayload,
	) {
		const template = await this.communicationsService.createTemplate(dto, user.sub);
		return {
			success: true,
			data: template,
			message: 'Template created successfully',
		};
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.TEMPLATES, PermissionAction.READ))
	@ApiOperation({ summary: 'Get a message template by ID' })
	async findTemplateById(@Param('id') id: string) {
		const template = await this.communicationsService.findTemplateById(id);
		return {
			success: true,
			data: template,
		};
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.TEMPLATES, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update a message template' })
	async updateTemplate(
		@Param('id') id: string,
		@Body() dto: UpdateTemplateDto,
		@CurrentUser() user: JwtPayload,
	) {
		const template = await this.communicationsService.updateTemplate(id, dto, user.sub);
		return {
			success: true,
			data: template,
			message: 'Template updated successfully',
		};
	}

	@Delete(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.TEMPLATES, PermissionAction.DELETE))
	@ApiOperation({ summary: 'Soft delete a message template' })
	async deleteTemplate(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.communicationsService.deleteTemplate(id, user.sub);
	}
}
