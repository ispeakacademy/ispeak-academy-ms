import { IsArray, IsOptional, IsString } from 'class-validator';

export class SubmitAssignmentDto {
	@IsOptional()
	@IsString()
	notes?: string;

	@IsOptional()
	@IsArray()
	@IsString({ each: true })
	attachmentUrls?: string[];
}
