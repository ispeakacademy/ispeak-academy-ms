import { ApiProperty } from '@nestjs/swagger';
import {
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	IsUUID,
	Matches,
	Min,
} from 'class-validator';

export class StkPushDto {
	@ApiProperty({
		description: 'Kenyan phone number in format 254XXXXXXXXX',
		example: '254712345678',
	})
	@IsNotEmpty()
	@IsString()
	@Matches(/^254\d{9}$/, {
		message: 'Phone number must be in format 254XXXXXXXXX (e.g., 254712345678)',
	})
	phoneNumber: string;

	@ApiProperty({ description: 'Invoice ID to pay for' })
	@IsNotEmpty()
	@IsUUID()
	invoiceId: string;

	@ApiProperty({ description: 'Payment amount in KES', minimum: 1 })
	@IsNumber()
	@Min(1)
	amount: number;

	@ApiProperty({ description: 'Transaction description', required: false })
	@IsOptional()
	@IsString()
	description?: string;
}
