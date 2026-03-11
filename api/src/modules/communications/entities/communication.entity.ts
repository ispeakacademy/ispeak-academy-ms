import { CommChannel } from '@/common/enums/comm-channel.enum';
import { CommDirection, CommStatus } from '@/common/enums/comm-status.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Client } from '@/modules/clients/entities/client.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('communications')
export class Communication extends AbstractEntity<Communication> {
	@PrimaryGeneratedColumn('uuid', { name: 'communication_id' })
	communicationId: string;

	@Column({ name: 'client_id', type: 'uuid', nullable: true })
	clientId?: string;

	@ManyToOne(() => Client, { nullable: true })
	@JoinColumn({ name: 'client_id' })
	client?: Client;

	@Column({ type: 'enum', enum: CommChannel })
	channel: CommChannel;

	@Column({ type: 'enum', enum: CommDirection, default: CommDirection.OUTBOUND })
	direction: CommDirection;

	@Column({ type: 'enum', enum: CommStatus, default: CommStatus.QUEUED })
	status: CommStatus;

	@Column({ nullable: true })
	subject?: string;

	@Column({ type: 'text' })
	body: string;

	@Column({ name: 'to_address', nullable: true })
	toAddress?: string;

	@Column({ name: 'from_address', nullable: true })
	fromAddress?: string;

	@Column({ name: 'external_message_id', nullable: true })
	externalMessageId?: string;

	@Column({ name: 'template_id', nullable: true })
	templateId?: string;

	@Column({ name: 'template_variables', type: 'jsonb', nullable: true })
	templateVariables?: Record<string, any>;

	@Column({ name: 'sent_at', nullable: true })
	sentAt?: Date;

	@Column({ name: 'delivered_at', nullable: true })
	deliveredAt?: Date;

	@Column({ name: 'read_at', nullable: true })
	readAt?: Date;

	@Column({ name: 'failure_reason', nullable: true })
	failureReason?: string;

	@Column({ name: 'sent_by_employee_id', nullable: true })
	sentByEmployeeId?: string;

	@Column({ name: 'parent_message_id', nullable: true })
	parentMessageId?: string;

	@Column({ name: 'attachment_urls', type: 'jsonb', default: [] })
	attachmentUrls: string[];
}
