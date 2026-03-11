import {
	IsArray,
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';

export class CreateEnrollmentDto {
	@IsNotEmpty()
	@IsUUID()
	clientId: string;

	@IsOptional()
	@IsUUID()
	cohortId?: string;

	@IsNotEmpty()
	@IsUUID()
	programId: string;

	@IsNotEmpty()
	@IsNumber()
	@Min(0)
	agreedAmount: number;

	@IsNotEmpty()
	@IsString()
	agreedCurrency: string;

	@IsOptional()
	@IsString()
	discountCode?: string;

	@IsOptional()
	@IsNumber()
	discountPercent?: number;

	@IsOptional()
	@IsString()
	scholarshipId?: string;

	@IsOptional()
	@IsArray()
	@IsUUID(undefined, { each: true })
	selectedModuleIds?: string[];

	@IsOptional()
	@IsBoolean()
	enrolledViaPortal?: boolean;
}
