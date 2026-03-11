import { EnrollmentStatus } from '@/common/enums/enrollment-status.enum';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryEnrollmentsDto {
	@IsOptional()
	@IsInt()
	@Min(1)
	@Transform(({ value }) => parseInt(value, 10))
	page?: number = 1;

	@IsOptional()
	@IsInt()
	@Min(1)
	@Max(100)
	@Transform(({ value }) => parseInt(value, 10))
	limit?: number = 20;

	@IsOptional()
	@IsEnum(EnrollmentStatus)
	status?: EnrollmentStatus;

	@IsOptional()
	@IsUUID()
	cohortId?: string;

	@IsOptional()
	@IsUUID()
	programId?: string;

	@IsOptional()
	@IsUUID()
	clientId?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@Transform(({ value }) => value === 'true' || value === true)
	@IsBoolean()
	own?: boolean;
}
