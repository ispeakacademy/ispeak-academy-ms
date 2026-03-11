import { AttendanceStatus } from '@/common/enums/attendance-status.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';
import { Session } from './session.entity';

@Entity('attendance')
export class Attendance extends AbstractEntity<Attendance> {
	@PrimaryGeneratedColumn('uuid', { name: 'attendance_id' })
	attendanceId: string;

	@Column({ name: 'session_id' })
	sessionId: string;

	@Column({ name: 'enrollment_id' })
	enrollmentId: string;

	@Column({ name: 'client_id' })
	clientId: string;

	@Column({ type: 'enum', enum: AttendanceStatus })
	status: AttendanceStatus;

	@Column({ name: 'joined_at', nullable: true })
	joinedAt?: Date;

	@Column({ name: 'left_at', nullable: true })
	leftAt?: Date;

	@Column({ name: 'minutes_attended', nullable: true })
	minutesAttended?: number;

	@Column({ name: 'marked_by_employee_id', nullable: true })
	markedByEmployeeId?: string;

	@Column({ type: 'text', nullable: true })
	notes?: string;

	@ManyToOne(() => Session, (s) => s.attendance, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'session_id' })
	session: Session;
}
