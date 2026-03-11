import {
	IsArray,
	IsBoolean,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
} from 'class-validator';

export class CreateProgramModuleDto {
	@IsNotEmpty()
	@IsString()
	title: string;

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
