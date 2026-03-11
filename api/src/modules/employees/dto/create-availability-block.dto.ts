import { BlockType } from '@/common/enums/block-type.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateAvailabilityBlockDto {
	@ApiProperty()
	@IsNotEmpty()
	@IsDateString()
	startDate: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsDateString()
	endDate: string;

	@ApiProperty({ enum: BlockType })
	@IsEnum(BlockType)
	@IsNotEmpty()
	type: BlockType;

	@ApiProperty({ required: false })
	@IsOptional()
	@IsString()
	reason?: string;
}
