import { IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class UpdateEnrollmentDto {
	@IsOptional()
	@IsUUID()
	cohortId?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	agreedAmount?: number;

	@IsOptional()
	@IsString()
	agreedCurrency?: string;

	@IsOptional()
	@IsString()
	discountCode?: string;

	@IsOptional()
	@IsNumber()
	discountPercent?: number;

	@IsOptional()
	@IsString()
	scholarshipId?: string;
}
