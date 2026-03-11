import { DeliveryMode } from '@/common/enums/delivery-mode.enum';
import { SessionStatus } from '@/common/enums/session-status.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Attendance } from './attendance.entity';
import { Cohort } from './cohort.entity';

@Entity('sessions')
export class Session extends AbstractEntity<Session> {
	@PrimaryGeneratedColumn('uuid', { name: 'session_id' })
	sessionId: string;

	@Column({ name: 'cohort_id' })
	cohortId: string;

	@Column({ name: 'module_id', nullable: true })
	moduleId?: string;

	@Column()
	title: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@Column({ name: 'scheduled_at', type: 'timestamptz' })
	scheduledAt: Date;

	@Column({ name: 'duration_minutes' })
	durationMinutes: number;

	@Column({ type: 'enum', enum: DeliveryMode })
	mode: DeliveryMode;

	@Column({ nullable: true })
	venue?: string;

	@Column({ name: 'meeting_link', nullable: true })
	meetingLink?: string;

	@Column({ name: 'meeting_password', nullable: true })
	meetingPassword?: string;

	@Column({ name: 'recording_url', nullable: true })
	recordingUrl?: string;

	@Column({ name: 'materials_url', nullable: true })
	materialsUrl?: string;

	@Column({ type: 'enum', enum: SessionStatus, default: SessionStatus.SCHEDULED })
	status: SessionStatus;

	@Column({ name: 'trainer_id', nullable: true })
	trainerId?: string;

	@Column({ name: 'cancel_reason', nullable: true })
	cancelReason?: string;

	@Column({ name: 'reschedule_of', nullable: true })
	rescheduleOf?: string;

	@Column({ name: 'reminder_24h_sent_at', type: 'timestamptz', nullable: true })
	reminder24hSentAt?: Date;

	@Column({ name: 'reminder_1h_sent_at', type: 'timestamptz', nullable: true })
	reminder1hSentAt?: Date;

	@ManyToOne(() => Cohort, (c) => c.sessions, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'cohort_id' })
	cohort: Cohort;

	@OneToMany(() => Attendance, (a) => a.session, { cascade: true })
	attendance: Attendance[];
}
