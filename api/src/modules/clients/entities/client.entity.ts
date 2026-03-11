import { ClientSegment } from '@/common/enums/client-segment.enum';
import { ClientStatus } from '@/common/enums/client-status.enum';
import { ClientType } from '@/common/enums/client-type.enum';
import { LeadSource } from '@/common/enums/lead-source.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Column, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ClientInteraction } from './client-interaction.entity';

@Entity('clients')
@Index(['email'], { unique: true, where: '"email" IS NOT NULL' })
export class Client extends AbstractEntity<Client> {
	@PrimaryGeneratedColumn('uuid', { name: 'client_id' })
	clientId: string;

	@Column({ name: 'first_name' })
	firstName: string;

	@Column({ name: 'last_name' })
	lastName: string;

	@Column({ nullable: true })
	email?: string;

	@Column({ nullable: true })
	phone?: string;

	@Column({ name: 'alternate_phone', nullable: true })
	alternatePhone?: string;

	@Column({ name: 'profile_photo_url', nullable: true })
	profilePhotoUrl?: string;

	@Column({ name: 'client_type', type: 'enum', enum: ClientType, default: ClientType.STUDENT })
	clientType: ClientType;

	@Column({ type: 'enum', enum: ClientSegment, nullable: true })
	segment?: ClientSegment;

	@Column({ name: 'is_corporate', default: false })
	isCorporate: boolean;

	@Column({ name: 'organisation_id', nullable: true })
	organisationId?: string;

	@Column({ nullable: true })
	country?: string;

	@Column({ nullable: true })
	county?: string;

	@Column({ nullable: true })
	city?: string;

	@Column({ nullable: true })
	timezone?: string;

	@Column({ name: 'lead_source', type: 'enum', enum: LeadSource, nullable: true })
	leadSource?: LeadSource;

	@Column({ name: 'referred_by_id', nullable: true })
	referredById?: string;

	@Column({ name: 'referral_code', nullable: true, unique: true })
	referralCode?: string;

	@Column({ type: 'enum', enum: ClientStatus, default: ClientStatus.LEAD })
	status: ClientStatus;

	@Column({ type: 'jsonb', default: [] })
	tags: string[];

	@Column({ name: 'preferred_currency', nullable: true })
	preferredCurrency?: string;

	@Column({ name: 'kra_pin', nullable: true })
	kraPin?: string;

	@Column({ name: 'gdpr_consent', default: false })
	gdprConsent: boolean;

	@Column({ name: 'gdpr_consent_at', nullable: true })
	gdprConsentAt?: Date;

	@Column({ name: 'marketing_opt_in', default: false })
	marketingOptIn: boolean;

	@Column({ type: 'text', nullable: true })
	notes?: string;

	@Column({ name: 'assigned_to_employee_id', nullable: true })
	assignedToEmployeeId?: string;

	@ManyToOne(() => Client, (client) => client.referrals, { nullable: true })
	@JoinColumn({ name: 'referred_by_id' })
	referredBy?: Client;

	@OneToMany(() => Client, (client) => client.referredBy)
	referrals?: Client[];

	@OneToMany(() => ClientInteraction, (interaction) => interaction.client)
	interactions?: ClientInteraction[];

	get fullName(): string {
		return `${this.firstName} ${this.lastName}`.trim();
	}
}
