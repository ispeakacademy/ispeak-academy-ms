import { ProgramType } from '@/common/enums/program-type.enum';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class QueryProgramsDto {
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
	@IsEnum(ProgramType)
	type?: ProgramType;

	@IsOptional()
	@IsBoolean()
	@Transform(({ value }) => value === 'true' || value === true)
	isActive?: boolean;

	@IsOptional()
	@IsString()
	search?: string;
}
