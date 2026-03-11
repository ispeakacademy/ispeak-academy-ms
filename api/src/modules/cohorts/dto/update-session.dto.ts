import { DeliveryMode } from '@/common/enums/delivery-mode.enum';
import { SessionStatus } from '@/common/enums/session-status.enum';
import {
	IsDateString,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';

export class UpdateSessionDto {
	@IsOptional()
	@IsUUID()
	moduleId?: string;

	@IsOptional()
	@IsString()
	title?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsDateString()
	scheduledAt?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	durationMinutes?: number;

	@IsOptional()
	@IsEnum(DeliveryMode)
	mode?: DeliveryMode;

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
	@IsString()
	recordingUrl?: string;

	@IsOptional()
	@IsString()
	materialsUrl?: string;

	@IsOptional()
	@IsEnum(SessionStatus)
	status?: SessionStatus;

	@IsOptional()
	@IsUUID()
	trainerId?: string;
}
