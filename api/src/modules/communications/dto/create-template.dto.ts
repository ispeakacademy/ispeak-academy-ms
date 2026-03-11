import { CommChannel } from '@/common/enums/comm-channel.enum';
import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
	@IsNotEmpty()
	@IsString()
	name: string;

	@IsNotEmpty()
	@IsString()
	category: string;

	@IsEnum(CommChannel)
	channel: CommChannel;

	@IsOptional()
	@IsString()
	subject?: string;

	@IsNotEmpty()
	@IsString()
	body: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	variables?: string[];
}
