import { CommChannel } from '@/common/enums/comm-channel.enum';
import { ClientSegment } from '@/common/enums/client-segment.enum';
import { ClientStatus } from '@/common/enums/client-status.enum';
import { ClientType } from '@/common/enums/client-type.enum';
import { Type } from 'class-transformer';
import {
	IsArray,
	IsBoolean,
	IsEnum,
	IsNotEmpty,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	ValidateNested,
} from 'class-validator';

export class AudienceFiltersDto {
	@IsOptional()
	@IsArray()
	@IsEnum(ClientStatus, { each: true })
	statuses?: ClientStatus[];

	@IsOptional()
	@IsArray()
	@IsEnum(ClientType, { each: true })
	clientTypes?: ClientType[];

	@IsOptional()
	@IsArray()
	@IsEnum(ClientSegment, { each: true })
	segments?: ClientSegment[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	countries?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	tags?: string[];

	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	programIds?: string[];

	@IsOptional()
	@IsBoolean()
	marketingOptInOnly?: boolean;
}

export class SendBulkMessageDto {
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	clientIds?: string[];

	@IsOptional()
	@ValidateNested()
	@Type(() => AudienceFiltersDto)
	filters?: AudienceFiltersDto;

	@IsEnum(CommChannel)
	channel: CommChannel;

	@IsOptional()
	@IsString()
	subject?: string;

	@IsNotEmpty()
	@IsString()
	body: string;

	@IsOptional()
	@IsUUID()
	templateId?: string;

	@IsOptional()
	@IsObject()
	templateVariables?: Record<string, any>;
}
