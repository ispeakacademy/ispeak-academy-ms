import { SubmissionStatus } from '@/common/enums/submission-status.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Assignment } from './assignment.entity';

@Entity('assignment_submissions')
export class AssignmentSubmission extends AbstractEntity<AssignmentSubmission> {
	@PrimaryGeneratedColumn('uuid', { name: 'submission_id' })
	submissionId: string;

	@Column({ name: 'assignment_id', type: 'uuid' })
	assignmentId: string;

	@Column({ name: 'client_id', type: 'uuid' })
	clientId: string;

	@Column({ type: 'text', nullable: true })
	notes?: string;

	@Column({ name: 'attachment_urls', type: 'jsonb', default: [] })
	attachmentUrls: string[];

	@Column({
		type: 'enum',
		enum: SubmissionStatus,
		default: SubmissionStatus.PENDING,
	})
	status: SubmissionStatus;

	@Column({ name: 'submitted_at', type: 'timestamptz', nullable: true })
	submittedAt?: Date;

	@Column({ name: 'reviewed_at', type: 'timestamptz', nullable: true })
	reviewedAt?: Date;

	@Column({ name: 'reviewed_by_employee_id', type: 'uuid', nullable: true })
	reviewedByEmployeeId?: string;

	@Column({ name: 'reviewer_feedback', type: 'text', nullable: true })
	reviewerFeedback?: string;

	@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
	score?: number;

	@ManyToOne(() => Assignment, (a) => a.submissions, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'assignment_id' })
	assignment: Assignment;
}
