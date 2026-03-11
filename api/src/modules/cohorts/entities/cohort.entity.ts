import { CohortStatus } from '@/common/enums/cohort-status.enum';
import { DeliveryMode } from '@/common/enums/delivery-mode.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Program } from '@/modules/programs/entities/program.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Session } from './session.entity';

@Entity('cohorts')
export class Cohort extends AbstractEntity<Cohort> {
	@PrimaryGeneratedColumn('uuid', { name: 'cohort_id' })
	cohortId: string;

	@Column({ name: 'program_id' })
	programId: string;

	@Column()
	name: string;

	@Column({ name: 'batch_code', unique: true })
	batchCode: string;

	@Column({ name: 'delivery_mode', type: 'enum', enum: DeliveryMode })
	deliveryMode: DeliveryMode;

	@Column({ nullable: true })
	venue?: string;

	@Column({ name: 'meeting_link', nullable: true })
	meetingLink?: string;

	@Column({ name: 'meeting_password', nullable: true })
	meetingPassword?: string;

	@Column({ name: 'start_date', type: 'date' })
	startDate: Date;

	@Column({ name: 'end_date', type: 'date' })
	endDate: Date;

	@Column({ name: 'max_capacity' })
	maxCapacity: number;

	@Column({ name: 'current_enrollment', default: 0 })
	currentEnrollment: number;

	@Column({ type: 'enum', enum: CohortStatus, default: CohortStatus.DRAFT })
	status: CohortStatus;

	@Column({ name: 'lead_trainer_id', nullable: true })
	leadTrainerId?: string;

	@Column({ name: 'trainer_ids', type: 'jsonb', default: [] })
	trainerIds: string[];

	@Column({ type: 'text', nullable: true })
	notes?: string;

	@ManyToOne(() => Program)
	@JoinColumn({ name: 'program_id' })
	program: Program;

	@OneToMany(() => Session, (s) => s.cohort, { cascade: true })
	sessions: Session[];
}
