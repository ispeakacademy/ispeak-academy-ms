import { NotificationType } from '@/common/enums/notification-type.enum';
import { Injectable, Logger } from '@nestjs/common';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsRepository } from './notifications.repository';

export interface CreateNotificationDto {
	recipientUserId: string;
	title: string;
	message: string;
	type: NotificationType;
	link?: string;
	metadata?: Record<string, any>;
}

@Injectable()
export class NotificationsService {
	private readonly logger = new Logger(NotificationsService.name);

	constructor(
		private readonly notificationsRepository: NotificationsRepository,
		private readonly gateway: NotificationsGateway,
	) {}

	async createNotification(dto: CreateNotificationDto) {
		const notification = await this.notificationsRepository.create({
			recipientUserId: dto.recipientUserId,
			title: dto.title,
			message: dto.message,
			type: dto.type,
			link: dto.link,
			metadata: dto.metadata,
		});

		// Push via WebSocket
		try {
			this.gateway.sendToUser(dto.recipientUserId, 'notification', notification);
		} catch (error) {
			this.logger.warn(`Failed to push notification via WebSocket: ${error.message}`);
		}

		return notification;
	}

	async getMyNotifications(userId: string, page = 1, limit = 20) {
		const skip = (page - 1) * limit;

		const [notifications, total] = await this.notificationsRepository
			.createQueryBuilder('n')
			.where('n.recipientUserId = :userId', { userId })
			.andWhere('n.deletedAt IS NULL')
			.orderBy('n.createdAt', 'DESC')
			.skip(skip)
			.take(limit)
			.getManyAndCount();

		return {
			data: notifications,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async getUnreadCount(userId: string): Promise<number> {
		return this.notificationsRepository
			.createQueryBuilder('n')
			.where('n.recipientUserId = :userId', { userId })
			.andWhere('n.isRead = false')
			.andWhere('n.deletedAt IS NULL')
			.getCount();
	}

	async markAsRead(notificationId: string, userId: string) {
		await this.notificationsRepository.update(
			{ notificationId, recipientUserId: userId } as any,
			{ isRead: true, readAt: new Date() } as any,
		);
		return { success: true };
	}

	async markAllAsRead(userId: string) {
		await this.notificationsRepository
			.createQueryBuilder('n')
			.update()
			.set({ isRead: true, readAt: new Date() })
			.where('recipientUserId = :userId', { userId })
			.andWhere('isRead = false')
			.execute();
		return { success: true };
	}
}
