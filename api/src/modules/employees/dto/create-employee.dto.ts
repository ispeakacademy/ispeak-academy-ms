import { EmployeeRole } from '@/common/enums/employee-role.enum';
import { EmploymentType } from '@/common/enums/employment-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import {
	IsArray,
	IsDateString,
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsNumber,
	IsObject,
	IsOptional,
	IsString,
	IsUUID,
	MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	firstName: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	lastName: string;

	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	phone?: string;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	profilePhotoUrl?: string;

	@ApiProperty({ enum: EmployeeRole })
	@IsEnum(EmployeeRole)
	@IsNotEmpty()
	role: EmployeeRole;

	@ApiProperty({ enum: EmploymentType })
	@IsEnum(EmploymentType)
	@IsNotEmpty()
	employmentType: EmploymentType;

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

	// User account creation fields
	@ApiProperty({ description: 'Role ID for the linked user account' })
	@IsNotEmpty()
	@IsUUID()
	roleId: string;

	@ApiProperty({ description: 'Temporary password for the linked user account' })
	@IsNotEmpty()
	@MinLength(6)
	password: string;
}
