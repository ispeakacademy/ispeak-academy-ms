import {
	IsArray,
	IsBoolean,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

export class UpdateProgramModuleDto {
	@IsOptional()
	@IsString()
	title?: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsNumber()
	orderIndex?: number;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	learningObjectives?: string[];

	@IsOptional()
	@IsNumber()
	estimatedHours?: number;

	@IsOptional()
	@IsBoolean()
	isOptional?: boolean;

	@IsOptional()
	@IsString()
	materials?: string;
}
