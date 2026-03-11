import { EmployeeRole } from '@/common/enums/employee-role.enum';
import { EmployeeStatus } from '@/common/enums/employee-status.enum';
import { EmploymentType } from '@/common/enums/employment-type.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
	Column,
	Entity,
	Index,
	JoinColumn,
	OneToMany,
	OneToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { TrainerAvailabilityBlock } from './trainer-availability-block.entity';

@Entity('employees')
@Index(['email'], { unique: true })
export class Employee extends AbstractEntity<Employee> {
	@PrimaryGeneratedColumn('uuid', { name: 'employee_id' })
	employeeId: string;

	@Column({ name: 'first_name' })
	firstName: string;

	@Column({ name: 'last_name' })
	lastName: string;

	@Column({ unique: true })
	email: string;

	@Column({ nullable: true })
	phone?: string;

	@Column({ name: 'profile_photo_url', nullable: true })
	profilePhotoUrl?: string;

	@Column({ type: 'enum', enum: EmployeeRole })
	role: EmployeeRole;

	@Column({ type: 'enum', enum: EmployeeStatus, default: EmployeeStatus.ACTIVE })
	status: EmployeeStatus;

	@Column({ name: 'employment_type', type: 'enum', enum: EmploymentType })
	employmentType: EmploymentType;

	@Column({ nullable: true })
	specialization?: string;

	@Column({ type: 'jsonb', default: [] })
	certifications: string[];

	@Column({ type: 'text', nullable: true })
	bio?: string;

	@Column({ name: 'linked_user_id', nullable: true })
	linkedUserId?: string;

	@Column({ name: 'start_date', type: 'date', nullable: true })
	startDate?: Date;

	@Column({ name: 'end_date', type: 'date', nullable: true })
	endDate?: Date;

	@Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
	hourlyRate?: number;

	@Column({ name: 'rate_currency', length: 3, nullable: true })
	rateCurrency?: string;

	@Column({ name: 'available_days', type: 'jsonb', default: [] })
	availableDays: string[];

	@Column({ name: 'available_hours', type: 'jsonb', nullable: true })
	availableHours?: { start: string; end: string };

	// Relations
	@OneToOne(() => User, { nullable: true })
	@JoinColumn({ name: 'linked_user_id' })
	user?: User;

	@OneToMany(() => TrainerAvailabilityBlock, (block) => block.employee, { cascade: true })
	availabilityBlocks: TrainerAvailabilityBlock[];

	get fullName(): string {
		return `${this.firstName || ''} ${this.lastName || ''}`.trim();
	}
}
