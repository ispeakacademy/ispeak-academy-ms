import { ProgramType } from '@/common/enums/program-type.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ProgramModule } from './program-module.entity';

export interface PricingTier {
	currency: string;
	amount: number;
	label: string;
	validUntil?: string;
}

@Entity('programs')
export class Program extends AbstractEntity<Program> {
	@PrimaryGeneratedColumn('uuid', { name: 'program_id' })
	programId: string;

	@Column({ unique: true })
	code: string;

	@Column()
	name: string;

	@Column({ type: 'text' })
	description: string;

	@Column({ name: 'short_description', type: 'text', nullable: true })
	shortDescription?: string;

	@Column({ type: 'enum', enum: ProgramType, default: ProgramType.FLAGSHIP })
	type: ProgramType;

	@Column({ name: 'duration_weeks', nullable: true })
	durationWeeks?: number;

	@Column({ name: 'duration_label', nullable: true })
	durationLabel?: string;

	@Column({ name: 'min_age', nullable: true })
	minAge?: number;

	@Column({ name: 'max_age', nullable: true })
	maxAge?: number;

	@Column({ name: 'target_audience', type: 'jsonb', default: [] })
	targetAudience: string[];

	@Column({ name: 'key_outcomes', type: 'jsonb', default: [] })
	keyOutcomes: string[];

	@Column({ name: 'is_active', default: true })
	isActive: boolean;

	@Column({ name: 'is_featured', default: false })
	isFeatured: boolean;

	@Column({ name: 'banner_image_url', nullable: true })
	bannerImageUrl?: string;

	@Column({ name: 'pricing_tiers', type: 'jsonb', default: [] })
	pricingTiers: PricingTier[];

	@Column({ name: 'trainer_ids', type: 'jsonb', default: [] })
	trainerIds: string[];

	@OneToMany(() => ProgramModule, (m) => m.program, { cascade: true })
	modules: ProgramModule[];
}
