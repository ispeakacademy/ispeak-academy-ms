import { EmployeeRole } from '@/common/enums/employee-role.enum';
import { EmployeeStatus } from '@/common/enums/employee-status.enum';
import { EmploymentType } from '@/common/enums/employment-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class QueryEmployeesDto {
	@ApiProperty({ required: false, default: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	page?: number = 1;

	@ApiProperty({ required: false, default: 10 })
	@IsOptional()
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	limit?: number = 10;

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
	search?: string;
}
