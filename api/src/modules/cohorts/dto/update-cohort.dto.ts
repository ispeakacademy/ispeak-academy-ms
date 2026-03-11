import { CohortStatus } from '@/common/enums/cohort-status.enum';
import { DeliveryMode } from '@/common/enums/delivery-mode.enum';
import {
	IsArray,
	IsDateString,
	IsEnum,
	IsInt,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';

export class UpdateCohortDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@IsString()
	batchCode?: string;

	@IsOptional()
	@IsEnum(DeliveryMode)
	deliveryMode?: DeliveryMode;

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
	@IsDateString()
	startDate?: string;

	@IsOptional()
	@IsDateString()
	endDate?: string;

	@IsOptional()
	@IsInt()
	@Min(1)
	maxCapacity?: number;

	@IsOptional()
	@IsEnum(CohortStatus)
	status?: CohortStatus;

	@IsOptional()
	@IsUUID()
	leadTrainerId?: string;

	@IsOptional()
	@IsArray()
	@IsUUID(undefined, { each: true })
	trainerIds?: string[];

	@IsOptional()
	@IsString()
	notes?: string;
}
