import { AbstractEntity } from '@/database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Program } from './program.entity';

@Entity('program_modules')
export class ProgramModule extends AbstractEntity<ProgramModule> {
	@PrimaryGeneratedColumn('uuid', { name: 'module_id' })
	moduleId: string;

	@Column({ name: 'program_id' })
	programId: string;

	@Column()
	title: string;

	@Column({ type: 'text', nullable: true })
	description?: string;

	@Column({ name: 'order_index' })
	orderIndex: number;

	@Column({ name: 'learning_objectives', type: 'jsonb', default: [] })
	learningObjectives: string[];

	@Column({ name: 'estimated_hours', type: 'decimal', precision: 5, scale: 2, nullable: true })
	estimatedHours?: number;

	@Column({ name: 'is_optional', default: false })
	isOptional: boolean;

	@Column({ type: 'text', nullable: true })
	materials?: string;

	@ManyToOne(() => Program, (p) => p.modules, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'program_id' })
	program: Program;
}
