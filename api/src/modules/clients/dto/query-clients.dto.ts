import { ClientStatus } from '@/common/enums/client-status.enum';
import { ClientType } from '@/common/enums/client-type.enum';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryClientsDto {
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 20;

	@IsOptional()
	@IsEnum(ClientStatus)
	status?: ClientStatus;

	@IsOptional()
	@IsEnum(ClientType)
	clientType?: ClientType;

	@IsOptional()
	@IsString()
	country?: string;

	@IsOptional()
	@IsString()
	county?: string;

	@IsOptional()
	@IsString()
	search?: string;

	@IsOptional()
	@IsString()
	assignedToEmployeeId?: string;
}
