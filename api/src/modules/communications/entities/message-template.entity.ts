import { CommChannel } from '@/common/enums/comm-channel.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('message_templates')
export class MessageTemplate extends AbstractEntity<MessageTemplate> {
	@PrimaryGeneratedColumn('uuid', { name: 'template_id' })
	templateId: string;

	@Column({ unique: true })
	name: string;

	@Column()
	category: string;

	@Column({ type: 'enum', enum: CommChannel })
	channel: CommChannel;

	@Column({ nullable: true })
	subject?: string;

	@Column({ type: 'text' })
	body: string;

	@Column({ type: 'jsonb', default: [] })
	variables: string[];

	@Column({ name: 'is_active', default: true })
	isActive: boolean;
}
