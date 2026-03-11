import { ProgressStatus } from '@/common/enums/progress-status.enum';
import {
	IsEnum,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';

export class UpdateModuleProgressDto {
	@IsOptional()
	@IsEnum(ProgressStatus)
	status?: ProgressStatus;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	score?: number;

	@IsOptional()
	@IsString()
	trainerFeedback?: string;
}
