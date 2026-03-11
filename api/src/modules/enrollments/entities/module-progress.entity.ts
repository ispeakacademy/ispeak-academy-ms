import { ProgressStatus } from '@/common/enums/progress-status.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { ProgramModule } from '@/modules/programs/entities/program-module.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Enrollment } from './enrollment.entity';

@Entity('module_progress')
export class ModuleProgress extends AbstractEntity<ModuleProgress> {
	@PrimaryGeneratedColumn('uuid', { name: 'module_progress_id' })
	moduleProgressId: string;

	@Column({ name: 'enrollment_id' })
	enrollmentId: string;

	@Column({ name: 'module_id', type: 'uuid' })
	moduleId: string;

	@Column({ type: 'enum', enum: ProgressStatus, default: ProgressStatus.NOT_STARTED })
	status: ProgressStatus;

	@Column({ name: 'started_at', nullable: true })
	startedAt?: Date;

	@Column({ name: 'completed_at', nullable: true })
	completedAt?: Date;

	@Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
	score?: number;

	@Column({ name: 'trainer_feedback', type: 'text', nullable: true })
	trainerFeedback?: string;

	@ManyToOne(() => Enrollment, (e) => e.moduleProgress, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'enrollment_id' })
	enrollment: Enrollment;

	@ManyToOne(() => ProgramModule, { eager: false })
	@JoinColumn({ name: 'module_id' })
	module: ProgramModule;
}
