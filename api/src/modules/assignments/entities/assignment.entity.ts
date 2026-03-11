import { AssignmentStatus } from '@/common/enums/assignment-status.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Enrollment } from '@/modules/enrollments/entities/enrollment.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { AssignmentSubmission } from './assignment-submission.entity';

@Entity('assignments')
export class Assignment extends AbstractEntity<Assignment> {
	@PrimaryGeneratedColumn('uuid', { name: 'assignment_id' })
	assignmentId: string;

	@Column({ name: 'enrollment_id', type: 'uuid' })
	enrollmentId: string;

	@Column({ name: 'cohort_id', type: 'uuid', nullable: true })
	cohortId?: string;

	@Column({ name: 'module_id', type: 'uuid', nullable: true })
	moduleId?: string;

	@Column()
	title: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@Column({ type: 'jsonb', default: [] })
	links: string[];

	@Column({ name: 'attachment_urls', type: 'jsonb', default: [] })
	attachmentUrls: string[];

	@Column({ name: 'due_date', type: 'timestamptz', nullable: true })
	dueDate?: Date;

	@Column({
		type: 'enum',
		enum: AssignmentStatus,
		default: AssignmentStatus.PUBLISHED,
	})
	status: AssignmentStatus;

	@Column({ name: 'created_by_employee_id', type: 'uuid' })
	createdByEmployeeId: string;

	@Column({ name: 'order_index', default: 0 })
	orderIndex: number;

	@ManyToOne(() => Enrollment, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'enrollment_id' })
	enrollment: Enrollment;

	@OneToMany(() => AssignmentSubmission, (s) => s.assignment, { cascade: true })
	submissions: AssignmentSubmission[];
}
