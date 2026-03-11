import { CommChannel } from '@/common/enums/comm-channel.enum';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
	@IsUUID()
	clientId: string;

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
