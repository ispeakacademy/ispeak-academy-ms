import { NotificationType } from '@/common/enums/notification-type.enum';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';

interface EnrollmentStatusEvent {
	enrollmentId: string;
	clientUserId: string;
	programName: string;
	status: string;
}

@Injectable()
export class EnrollmentListener {
	private readonly logger = new Logger(EnrollmentListener.name);

	constructor(private readonly notificationsService: NotificationsService) {}

	@OnEvent('enrollment.approved')
	async handleEnrollmentApproved(event: EnrollmentStatusEvent) {
		try {
			await this.notificationsService.createNotification({
				recipientUserId: event.clientUserId,
				title: 'Enrollment Approved',
				message: `Your enrollment in "${event.programName}" has been approved!`,
				type: NotificationType.ENROLLMENT_APPROVED,
				link: '/portal/programs',
				metadata: { enrollmentId: event.enrollmentId },
			});
		} catch (error) {
			this.logger.error(`Failed to notify enrollment.approved: ${error.message}`);
		}
	}

	@OnEvent('enrollment.confirmed')
	async handleEnrollmentConfirmed(event: EnrollmentStatusEvent) {
		try {
			await this.notificationsService.createNotification({
				recipientUserId: event.clientUserId,
				title: 'Enrollment Confirmed',
				message: `Welcome! Your enrollment in "${event.programName}" is confirmed.`,
				type: NotificationType.ENROLLMENT_CONFIRMED,
				link: '/portal/programs',
				metadata: { enrollmentId: event.enrollmentId },
			});
		} catch (error) {
			this.logger.error(`Failed to notify enrollment.confirmed: ${error.message}`);
		}
	}
}
