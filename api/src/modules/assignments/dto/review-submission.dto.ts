import { SubmissionStatus } from '@/common/enums/submission-status.enum';
import { IsEnum, IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class ReviewSubmissionDto {
	@IsEnum(SubmissionStatus)
	status: SubmissionStatus;

	@IsOptional()
	@IsString()
	feedback?: string;

	@IsOptional()
	@IsNumber()
	@Min(0)
	@Max(100)
	score?: number;
}
