import { BlockType } from '@/common/enums/block-type.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

@Entity('trainer_availability_blocks')
export class TrainerAvailabilityBlock extends AbstractEntity<TrainerAvailabilityBlock> {
	@PrimaryGeneratedColumn('uuid', { name: 'block_id' })
	blockId: string;

	@Column({ name: 'employee_id' })
	employeeId: string;

	@Column({ name: 'start_date', type: 'date' })
	startDate: Date;

	@Column({ name: 'end_date', type: 'date' })
	endDate: Date;

	@Column({ type: 'enum', enum: BlockType })
	type: BlockType;

	@Column({ nullable: true })
	reason?: string;

	@ManyToOne(() => Employee, (e) => e.availabilityBlocks, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'employee_id' })
	employee: Employee;
}
