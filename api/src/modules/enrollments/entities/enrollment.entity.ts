import { EnrollmentStatus } from '@/common/enums/enrollment-status.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Client } from '@/modules/clients/entities/client.entity';
import { Cohort } from '@/modules/cohorts/entities/cohort.entity';
import { Program } from '@/modules/programs/entities/program.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { ModuleProgress } from './module-progress.entity';

@Entity('enrollments')
export class Enrollment extends AbstractEntity<Enrollment> {
	@PrimaryGeneratedColumn('uuid', { name: 'enrollment_id' })
	enrollmentId: string;

	@Column({ name: 'client_id' })
	clientId: string;

	@Column({ name: 'cohort_id', nullable: true })
	cohortId?: string;

	@Column({ name: 'program_id', type: 'uuid' })
	programId: string;

	@Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.APPLIED })
	status: EnrollmentStatus;

	@Column({ name: 'application_date', nullable: true })
	applicationDate?: Date;

	@Column({ name: 'approval_date', nullable: true })
	approvalDate?: Date;

	@Column({ name: 'approved_by_employee_id', nullable: true })
	approvedByEmployeeId?: string;

	@Column({ name: 'drop_date', nullable: true })
	dropDate?: Date;

	@Column({ name: 'drop_reason', nullable: true })
	dropReason?: string;

	// Financials snapshot at enrollment time
	@Column({ name: 'agreed_amount', type: 'decimal', precision: 12, scale: 2 })
	agreedAmount: number;

	@Column({ name: 'agreed_currency', length: 3 })
	agreedCurrency: string;

	@Column({ name: 'discount_code', nullable: true })
	discountCode?: string;

	@Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
	discountPercent: number;

	@Column({ name: 'scholarship_id', nullable: true })
	scholarshipId?: string;

	// Progress
	@Column({ name: 'progress_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
	progressPercent: number;

	@Column({ name: 'completion_date', nullable: true })
	completionDate?: Date;

	@Column({ name: 'certificate_issued_at', nullable: true })
	certificateIssuedAt?: Date;

	@Column({ name: 'certificate_url', nullable: true })
	certificateUrl?: string;

	// COP-404 Customization
	@Column({ name: 'selected_module_ids', type: 'jsonb', default: [] })
	selectedModuleIds: string[];

	// Source
	@Column({ name: 'enrolled_by_employee_id', nullable: true })
	enrolledByEmployeeId?: string;

	@Column({ name: 'enrolled_via_portal', default: false })
	enrolledViaPortal: boolean;

	// Relations
	@ManyToOne(() => Client)
	@JoinColumn({ name: 'client_id' })
	client: Client;

	@ManyToOne(() => Cohort, { nullable: true })
	@JoinColumn({ name: 'cohort_id' })
	cohort?: Cohort;

	@ManyToOne(() => Program)
	@JoinColumn({ name: 'program_id' })
	program: Program;

	@OneToMany(() => ModuleProgress, (mp) => mp.enrollment, { cascade: true })
	moduleProgress: ModuleProgress[];
}
