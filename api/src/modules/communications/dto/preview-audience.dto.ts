import { Type } from 'class-transformer';
import {
	IsArray,
	IsOptional,
	IsUUID,
	ValidateNested,
} from 'class-validator';
import { AudienceFiltersDto } from './send-bulk-message.dto';

export class PreviewAudienceDto {
	@IsOptional()
	@IsArray()
	@IsUUID('4', { each: true })
	clientIds?: string[];

	@IsOptional()
	@ValidateNested()
	@Type(() => AudienceFiltersDto)
	filters?: AudienceFiltersDto;
}
