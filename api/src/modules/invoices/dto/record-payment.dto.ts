import { PaymentMethod } from '@/common/enums/payment-method.enum';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class RecordPaymentDto {
	@ApiProperty({ description: 'Payment amount', minimum: 0.01 })
	@IsNumber()
	@Min(0.01)
	amount: number;

	@ApiProperty({ description: 'Currency code', default: 'KES', required: false })
	@IsOptional()
	@IsString()
	currency?: string = 'KES';

	@ApiProperty({ description: 'Payment method', enum: PaymentMethod })
	@IsEnum(PaymentMethod)
	method: PaymentMethod;

	@ApiProperty({ description: 'External reference (e.g., M-Pesa receipt, bank ref)', required: false })
	@IsOptional()
	@IsString()
	externalReference?: string;

	@ApiProperty({ description: 'Name of the person who made the payment', required: false })
	@IsOptional()
	@IsString()
	payerName?: string;

	@ApiProperty({ description: 'Date of payment' })
	@Transform(({ value }) => new Date(value))
	@IsDate()
	paymentDate: Date;

	@ApiProperty({ description: 'Additional notes', required: false })
	@IsOptional()
	@IsString()
	notes?: string;
}
