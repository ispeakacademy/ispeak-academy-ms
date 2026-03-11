import {
	IsArray,
	IsDateString,
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';

export class CreateAssignmentDto {
	@IsOptional()
	@IsUUID()
	enrollmentId?: string;

	@IsOptional()
	@IsUUID()
	cohortId?: string;

	@IsOptional()
	@IsUUID()
	moduleId?: string;

	@IsNotEmpty()
	@IsString()
	title: string;

	@IsOptional()
	@IsString()
	description?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	links?: string[];

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	attachmentUrls?: string[];

	@IsOptional()
	@IsDateString()
	dueDate?: string;
}
