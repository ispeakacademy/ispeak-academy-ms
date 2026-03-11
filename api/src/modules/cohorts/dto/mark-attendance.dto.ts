import { AttendanceStatus } from '@/common/enums/attendance-status.enum';
import { Type } from 'class-transformer';
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
	ValidateNested,
} from 'class-validator';

export class AttendanceEntryDto {
	@IsNotEmpty()
	@IsUUID()
	enrollmentId: string;

	@IsNotEmpty()
	@IsUUID()
	clientId: string;

	@IsNotEmpty()
	@IsEnum(AttendanceStatus)
	status: AttendanceStatus;

	@IsOptional()
	@IsDateString()
	joinedAt?: string;

	@IsOptional()
	@IsDateString()
	leftAt?: string;

	@IsOptional()
	@IsInt()
	@Min(0)
	minutesAttended?: number;

	@IsOptional()
	@IsString()
	notes?: string;
}

export class MarkAttendanceDto {
	@IsArray()
	@ValidateNested({ each: true })
	@Type(() => AttendanceEntryDto)
	entries: AttendanceEntryDto[];
}
