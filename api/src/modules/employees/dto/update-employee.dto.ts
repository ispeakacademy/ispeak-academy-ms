import { EmployeeRole } from '@/common/enums/employee-role.enum';
import { EmployeeStatus } from '@/common/enums/employee-status.enum';
import { EmploymentType } from '@/common/enums/employment-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
	IsArray,
	IsDateString,
	IsEmail,
	IsEnum,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
} from 'class-validator';

export class UpdateEmployeeDto {
	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	firstName?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	lastName?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsEmail()
	email?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	phone?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	profilePhotoUrl?: string;

	@ApiProperty({ required: false, enum: EmployeeRole })
	@IsOptional()
	@IsEnum(EmployeeRole)
	role?: EmployeeRole;

	@ApiProperty({ required: false, enum: EmployeeStatus })
	@IsOptional()
	@IsEnum(EmployeeStatus)
	status?: EmployeeStatus;

	@ApiProperty({ required: false, enum: EmploymentType })
	@IsOptional()
	@IsEnum(EmploymentType)
	employmentType?: EmploymentType;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	specialization?: string;

	@ApiProperty({ required: false, type: [String] })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	certifications?: string[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	bio?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsDateString()
	startDate?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsDateString()
	endDate?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsNumber()
	hourlyRate?: number;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	rateCurrency?: string;

	@ApiProperty({ required: false, type: [String] })
	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	availableDays?: string[];

	@ApiProperty({ required: false })
	@IsOptional()
	@IsObject()
	availableHours?: { start: string; end: string };
}
