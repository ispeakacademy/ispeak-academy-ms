import { AbstractEntity } from '@/database/abstract.entity';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('organisations')
export class Organisation extends AbstractEntity<Organisation> {
	@PrimaryGeneratedColumn('uuid', { name: 'organisation_id' })
	organisationId: string;

	@Column()
	name: string;

	@Column({ nullable: true })
	industry?: string;

	@Column({ nullable: true })
	website?: string;

	@Column({ name: 'kra_pin', nullable: true })
	kraPin?: string;

	@Column({ name: 'billing_email', nullable: true })
	billingEmail?: string;

	@Column({ name: 'billing_phone', nullable: true })
	billingPhone?: string;

	@Column({ name: 'billing_address', nullable: true })
	billingAddress?: string;

	@Column({ nullable: true })
	country?: string;

	@Column({ name: 'primary_contact_id', nullable: true })
	primaryContactId?: string;
}
