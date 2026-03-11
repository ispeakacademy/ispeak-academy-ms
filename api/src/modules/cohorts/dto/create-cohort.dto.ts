import { CohortStatus } from '@/common/enums/cohort-status.enum';
import { DeliveryMode } from '@/common/enums/delivery-mode.enum';
import {
	IsArray,
	IsDateString,
	IsEnum,
	IsInt,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	Min,
} from 'class-validator';

export class CreateCohortDto {
	@IsNotEmpty()
	@IsUUID()
	programId: string;

	@IsNotEmpty()
	@IsString()
	name: string;

	@IsNotEmpty()
	@IsString()
	batchCode: string;

	@IsNotEmpty()
	@IsEnum(DeliveryMode)
	deliveryMode: DeliveryMode;

	@IsOptional()
	@IsString()
	venue?: string;

	@IsOptional()
	@IsString()
	meetingLink?: string;

	@IsOptional()
	@IsString()
	meetingPassword?: string;

	@IsNotEmpty()
	@IsDateString()
	startDate: string;

	@IsNotEmpty()
	@IsDateString()
	endDate: string;

	@IsNotEmpty()
	@IsInt()
	@Min(1)
	maxCapacity: number;

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
