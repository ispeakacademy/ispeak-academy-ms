import { ProgramType } from '@/common/enums/program-type.enum';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	ValidateNested,
} from 'class-validator';

export class PricingTierDto {
	@IsString()
	@IsNotEmpty()
	currency: string;

	@IsNumber()
	amount: number;

	@IsString()
	@IsNotEmpty()
	label: string;

	@IsOptional()
	@IsString()
	validUntil?: string;
}

export class CreateProgramDto {
	@IsNotEmpty()
	@IsString()
	code: string;

	@IsNotEmpty()
	@IsString()
	name: string;

	@IsNotEmpty()
	@IsString()
	description: string;

	@IsOptional()
	@IsString()
	shortDescription?: string;

	@IsOptional()
	@IsEnum(ProgramType)
	type?: ProgramType;

	@IsOptional()
	@IsNumber()
	durationWeeks?: number;

	@IsOptional()
	@IsString()
	durationLabel?: string;

	@IsOptional()
	@IsNumber()
	minAge?: number;

	@IsOptional()
	@IsNumber()
	maxAge?: number;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	targetAudience?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	keyOutcomes?: string[];

	@IsOptional()
	@IsBoolean()
	isActive?: boolean;

	@IsOptional()
	@IsBoolean()
	isFeatured?: boolean;

	@IsOptional()
	@IsString()
	bannerImageUrl?: string;

	@IsOptional()
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => PricingTierDto)
	pricingTiers?: PricingTierDto[];
}
