import { InteractionDirection, InteractionType } from '@/common/enums/interaction-type.enum';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateInteractionDto {
	@IsEnum(InteractionType)
	@IsNotEmpty()
	type: InteractionType;

	@IsEnum(InteractionDirection)
	@IsNotEmpty()
	direction: InteractionDirection;

	@IsString()
	@IsNotEmpty()
	summary: string;

	@IsOptional()
	@IsString()
	outcome?: string;

	@IsOptional()
	@IsDateString()
	followUpDate?: string;

	@IsOptional()
	@IsString()
	followUpNote?: string;
}
