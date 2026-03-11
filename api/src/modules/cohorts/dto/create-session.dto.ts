import { DeliveryMode } from '@/common/enums/delivery-mode.enum';
import {
	IsDateString,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';

export class CreateSessionDto {
	@IsOptional()
	@IsUUID()
	moduleId?: string;

	@IsNotEmpty()
	@IsString()
	title: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsNotEmpty()
	@IsDateString()
	scheduledAt: string;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	durationMinutes: number;

	@IsNotEmpty()
	@IsEnum(DeliveryMode)
	mode: DeliveryMode;

	@IsOptional()
	@IsString()
	venue?: string;

	@IsOptional()
	@IsString()
	meetingLink?: string;

	@IsOptional()
	@IsString()
	meetingPassword?: string;

	@IsOptional()
	@IsUUID()
	trainerId?: string;

	@IsOptional()
	@IsString()
	materialsUrl?: string;
}
