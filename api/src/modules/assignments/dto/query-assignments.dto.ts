import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryAssignmentsDto {
	@IsOptional()
	page?: number;

	@IsOptional()
	limit?: number;

	@IsOptional()
	@IsUUID()
	enrollmentId?: string;

	@IsOptional()
	@IsUUID()
	cohortId?: string;

	@IsOptional()
	@IsUUID()
	moduleId?: string;

	@IsOptional()
	@IsBoolean()
	own?: boolean;

	@IsOptional()
	@IsString()
	status?: string;
}
