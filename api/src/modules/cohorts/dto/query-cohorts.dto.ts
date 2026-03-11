import { CohortStatus } from '@/common/enums/cohort-status.enum';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryCohortsDto {
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
	@IsUUID()
	programId?: string;

	@IsOptional()
	@IsEnum(CohortStatus)
	status?: CohortStatus;

	@IsOptional()
	@IsString()
	search?: string;
}
