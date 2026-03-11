import { NotificationType } from '@/common/enums/notification-type.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { User } from '@/modules/users/entities/user.entity';
import {
	Column,
	Entity,
	JoinColumn,
	ManyToOne,
	PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notifications')
export class Notification extends AbstractEntity<Notification> {
	@PrimaryGeneratedColumn('uuid', { name: 'notification_id' })
	notificationId: string;

	@Column({ name: 'recipient_user_id', type: 'uuid' })
	recipientUserId: string;

	@Column()
	title: string;

	@Column({ type: 'text' })
	message: string;

	@Column({ type: 'enum', enum: NotificationType, default: NotificationType.GENERAL })
	type: NotificationType;

	@Column({ name: 'is_read', default: false })
	isRead: boolean;

	@Column({ name: 'read_at', type: 'timestamptz', nullable: true })
	readAt?: Date;

	@Column({ nullable: true })
	link?: string;

	@Column({ type: 'jsonb', nullable: true })
	metadata?: Record<string, any>;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'recipient_user_id' })
	recipientUser: User;
}
