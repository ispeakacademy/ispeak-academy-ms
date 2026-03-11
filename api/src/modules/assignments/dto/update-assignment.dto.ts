import {
	IsArray,
	IsDateString,
	IsEnum,
	IsOptional,
	IsString,
	IsUUID,
} from 'class-validator';
import { AssignmentStatus } from '@/common/enums/assignment-status.enum';

export class UpdateAssignmentDto {
	@IsOptional()
	@IsUUID()
	moduleId?: string;

	@IsOptional()
	@IsString()
	title?: string;

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

	@IsOptional()
	@IsEnum(AssignmentStatus)
	status?: AssignmentStatus;
}
