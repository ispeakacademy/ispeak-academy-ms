import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import {
	Controller,
	Get,
	Param,
	Patch,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@ApiTags('Notifications')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
	constructor(private readonly notificationsService: NotificationsService) {}

	@Get()
	@ApiOperation({ summary: 'Get my notifications (paginated)' })
	async getMyNotifications(
		@CurrentUser() user: JwtPayload,
		@Query('page') page?: number,
		@Query('limit') limit?: number,
	) {
		const result = await this.notificationsService.getMyNotifications(
			user.sub,
			page || 1,
			limit || 20,
		);
		return { success: true, data: result };
	}

	@Get('unread-count')
	@ApiOperation({ summary: 'Get unread notification count' })
	async getUnreadCount(@CurrentUser() user: JwtPayload) {
		const count = await this.notificationsService.getUnreadCount(user.sub);
		return { success: true, data: { count } };
	}

	@Patch(':id/read')
	@ApiOperation({ summary: 'Mark a notification as read' })
	async markAsRead(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		await this.notificationsService.markAsRead(id, user.sub);
		return { success: true, message: 'Notification marked as read' };
	}

	@Patch('read-all')
	@ApiOperation({ summary: 'Mark all notifications as read' })
	async markAllAsRead(@CurrentUser() user: JwtPayload) {
		await this.notificationsService.markAllAsRead(user.sub);
		return { success: true, message: 'All notifications marked as read' };
	}
}
