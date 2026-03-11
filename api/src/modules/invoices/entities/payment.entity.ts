import { PaymentMethod } from '@/common/enums/payment-method.enum';
import { PaymentStatus } from '@/common/enums/payment-status.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('payments')
export class Payment extends AbstractEntity<Payment> {
	@PrimaryGeneratedColumn('uuid', { name: 'payment_id' })
	paymentId: string;

	@Column({ name: 'invoice_id' })
	invoiceId: string;

	@Column({ type: 'decimal', precision: 12, scale: 2 })
	amount: number;

	@Column({ length: 3, default: 'KES' })
	currency: string;

	@Column({ type: 'enum', enum: PaymentMethod })
	method: PaymentMethod;

	@Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
	status: PaymentStatus;

	@Column({ name: 'external_reference', nullable: true })
	externalReference?: string;

	@Column({ name: 'mpesa_transaction_id', nullable: true })
	mpesaTransactionId?: string;

	@Column({ name: 'mpesa_phone_number', nullable: true })
	mpesaPhoneNumber?: string;

	@Column({ name: 'payer_name', nullable: true })
	payerName?: string;

	@Column({ name: 'payment_date' })
	paymentDate: Date;

	@Column({ type: 'text', nullable: true })
	notes?: string;

	@Column({ name: 'recorded_by_employee_id', nullable: true })
	recordedByEmployeeId?: string;

	@Column({ name: 'is_auto_reconciled', default: false })
	isAutoReconciled: boolean;

	@ManyToOne(() => Invoice, (invoice) => invoice.payments, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'invoice_id' })
	invoice: Invoice;
}
