import { InteractionDirection, InteractionType } from '@/common/enums/interaction-type.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Client } from './client.entity';

@Entity('client_interactions')
export class ClientInteraction extends AbstractEntity<ClientInteraction> {
	@PrimaryGeneratedColumn('uuid', { name: 'interaction_id' })
	interactionId: string;

	@Column({ name: 'client_id' })
	clientId: string;

	@Column({ type: 'enum', enum: InteractionType })
	type: InteractionType;

	@Column({ type: 'enum', enum: InteractionDirection })
	direction: InteractionDirection;

	@Column({ type: 'text' })
	summary: string;

	@Column({ type: 'text', nullable: true })
	outcome?: string;

	@Column({ name: 'follow_up_date', nullable: true })
	followUpDate?: Date;

	@Column({ name: 'follow_up_note', nullable: true })
	followUpNote?: string;

	@Column({ name: 'created_by_employee_id' })
	createdByEmployeeId: string;

	@Column({ name: 'linked_communication_id', nullable: true })
	linkedCommunicationId?: string;

	@ManyToOne(() => Client, (client) => client.interactions)
	@JoinColumn({ name: 'client_id' })
	client: Client;
}
