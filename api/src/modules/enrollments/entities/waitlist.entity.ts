import { AbstractEntity } from '@/database/abstract.entity';
import {
	Column,
	Entity,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('waitlist')
export class Waitlist extends AbstractEntity<Waitlist> {
	@PrimaryGeneratedColumn('uuid', { name: 'waitlist_id' })
	waitlistId: string;

	@Column({ name: 'client_id' })
	clientId: string;

	@Column({ name: 'cohort_id' })
	cohortId: string;

	@Column()
	position: number;

	@Column({ name: 'notified_at', nullable: true })
	notifiedAt?: Date;

	@Column({ name: 'has_responded', default: false })
	hasResponded: boolean;

	@Column({ name: 'response_deadline', nullable: true })
	responseDeadline?: Date;

	@Column({ name: 'converted_to_enrollment_id', nullable: true })
	convertedToEnrollmentId?: string;
}
