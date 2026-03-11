import { NotificationType } from '@/common/enums/notification-type.enum';
import { SessionStatus } from '@/common/enums/session-status.enum';
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, IsNull, Repository } from 'typeorm';
import { Session } from '@/modules/cohorts/entities/session.entity';
import { Enrollment } from '@/modules/enrollments/entities/enrollment.entity';
import { User } from '@/modules/users/entities/user.entity';
import { NotificationsService } from '../notifications.service';

@Injectable()
export class SessionListener {
	private readonly logger = new Logger(SessionListener.name);

	constructor(
		private readonly notificationsService: NotificationsService,
		@InjectRepository(Session)
		private readonly sessionRepository: Repository<Session>,
		@InjectRepository(Enrollment)
		private readonly enrollmentRepository: Repository<Enrollment>,
		@InjectRepository(User)
		private readonly userRepository: Repository<User>,
	) {}

	@Cron(CronExpression.EVERY_30_MINUTES)
	async handleSessionReminders() {
		try {
			await this.send24hReminders();
			await this.send1hReminders();
		} catch (error) {
			this.logger.error(`Session reminder cron failed: ${error.message}`, error.stack);
		}
	}

	private async send24hReminders() {
		const now = new Date();
		const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
		const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

		const sessions = await this.sessionRepository.find({
			where: {
				scheduledAt: Between(in23h, in25h),
				status: SessionStatus.SCHEDULED,
				reminder24hSentAt: IsNull(),
			},
			relations: ['cohort'],
		});

		for (const session of sessions) {
			await this.notifyEnrolledClients(session, NotificationType.SESSION_REMINDER_24H, '24h');
			await this.sessionRepository.update(session.sessionId, { reminder24hSentAt: new Date() });
		}

		if (sessions.length > 0) {
			this.logger.log(`Sent 24h reminders for ${sessions.length} sessions`);
		}
	}

	private async send1hReminders() {
		const now = new Date();
		const in30m = new Date(now.getTime() + 30 * 60 * 1000);
		const in90m = new Date(now.getTime() + 90 * 60 * 1000);

		const sessions = await this.sessionRepository.find({
			where: {
				scheduledAt: Between(in30m, in90m),
				status: SessionStatus.SCHEDULED,
				reminder1hSentAt: IsNull(),
			},
			relations: ['cohort'],
		});

		for (const session of sessions) {
			await this.notifyEnrolledClients(session, NotificationType.SESSION_REMINDER_1H, '1h');
			await this.sessionRepository.update(session.sessionId, { reminder1hSentAt: new Date() });
		}

		if (sessions.length > 0) {
			this.logger.log(`Sent 1h reminders for ${sessions.length} sessions`);
		}
	}

	private async notifyEnrolledClients(session: Session, type: NotificationType, timeLabel: string) {
		// Find all active/confirmed enrollments for this cohort
		const enrollments = await this.enrollmentRepository.find({
			where: { cohortId: session.cohortId },
		});

		const activeStatuses = ['active', 'confirmed'];
		const activeEnrollments = enrollments.filter((e) => activeStatuses.includes(e.status));

		for (const enrollment of activeEnrollments) {
			// Find user linked to this client
			const user = await this.userRepository.findOne({
				where: { linkedClientId: enrollment.clientId },
			});

			if (user) {
				const timeStr = new Date(session.scheduledAt).toLocaleString();
				await this.notificationsService.createNotification({
					recipientUserId: user.userId,
					title: `Session in ${timeLabel}`,
					message: `"${session.title}" starts at ${timeStr}`,
					type,
					link: '/portal/sessions',
					metadata: { sessionId: session.sessionId, cohortId: session.cohortId },
				});
			}
		}
	}
}
