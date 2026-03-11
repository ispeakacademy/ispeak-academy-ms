import { NotificationType } from '@/common/enums/notification-type.enum';
import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationsService } from '../notifications.service';

interface AssignmentCreatedEvent {
	assignmentId: string;
	title: string;
	enrollmentId: string;
	clientUserId: string;
	programName: string;
}

interface AssignmentSubmittedEvent {
	assignmentId: string;
	title: string;
	clientName: string;
	trainerUserId: string;
	enrollmentId: string;
}

interface AssignmentReviewedEvent {
	assignmentId: string;
	title: string;
	clientUserId: string;
	status: string;
	enrollmentId: string;
}

@Injectable()
export class AssignmentListener {
	private readonly logger = new Logger(AssignmentListener.name);

	constructor(private readonly notificationsService: NotificationsService) {}

	@OnEvent('assignment.created')
	async handleAssignmentCreated(event: AssignmentCreatedEvent) {
		try {
			await this.notificationsService.createNotification({
				recipientUserId: event.clientUserId,
				title: 'New Assignment',
				message: `You have a new assignment: "${event.title}"`,
				type: NotificationType.ASSIGNMENT_POSTED,
				link: '/portal/assignments',
				metadata: { assignmentId: event.assignmentId, enrollmentId: event.enrollmentId },
			});
		} catch (error) {
			this.logger.error(`Failed to notify for assignment.created: ${error.message}`);
		}
	}

	@OnEvent('assignment.submitted')
	async handleAssignmentSubmitted(event: AssignmentSubmittedEvent) {
		try {
			await this.notificationsService.createNotification({
				recipientUserId: event.trainerUserId,
				title: 'Assignment Submitted',
				message: `${event.clientName} submitted "${event.title}"`,
				type: NotificationType.ASSIGNMENT_SUBMITTED,
				link: '/admin/enrollments',
				metadata: { assignmentId: event.assignmentId, enrollmentId: event.enrollmentId },
			});
		} catch (error) {
			this.logger.error(`Failed to notify for assignment.submitted: ${error.message}`);
		}
	}

	@OnEvent('assignment.reviewed')
	async handleAssignmentReviewed(event: AssignmentReviewedEvent) {
		try {
			const isRevision = event.status === 'revision_requested';
			await this.notificationsService.createNotification({
				recipientUserId: event.clientUserId,
				title: isRevision ? 'Revision Requested' : 'Assignment Reviewed',
				message: isRevision
					? `Your assignment "${event.title}" needs revision`
					: `Your assignment "${event.title}" has been reviewed`,
				type: isRevision ? NotificationType.ASSIGNMENT_REVISION_REQUESTED : NotificationType.ASSIGNMENT_REVIEWED,
				link: '/portal/assignments',
				metadata: { assignmentId: event.assignmentId, enrollmentId: event.enrollmentId },
			});
		} catch (error) {
			this.logger.error(`Failed to notify for assignment.reviewed: ${error.message}`);
		}
	}
}
