import { CommChannel } from '@/common/enums/comm-channel.enum';
import { CommDirection, CommStatus } from '@/common/enums/comm-status.enum';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export class QueryCommunicationsDto {
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
	@IsEnum(CommChannel)
	channel?: CommChannel;

	@IsOptional()
	@IsEnum(CommStatus)
	status?: CommStatus;

	@IsOptional()
	@IsEnum(CommDirection)
	direction?: CommDirection;

	@IsOptional()
	@IsUUID()
	clientId?: string;
}
