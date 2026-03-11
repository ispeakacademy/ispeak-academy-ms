import { InvoiceStatus } from '@/common/enums/invoice-status.enum';
import { InvoiceType } from '@/common/enums/invoice-type.enum';
import { AbstractEntity } from '@/database/abstract.entity';
import { Client } from '@/modules/clients/entities/client.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { InvoiceLineItem } from './invoice-line-item.entity';
import { Payment } from './payment.entity';

@Entity('invoices')
export class Invoice extends AbstractEntity<Invoice> {
	@PrimaryGeneratedColumn('uuid', { name: 'invoice_id' })
	invoiceId: string;

	@Column({ name: 'invoice_number', unique: true })
	invoiceNumber: string;

	@Column({ name: 'client_id', type: 'uuid', nullable: true })
	clientId?: string;

	@ManyToOne(() => Client, { nullable: true })
	@JoinColumn({ name: 'client_id' })
	client?: Client;

	@Column({ name: 'organisation_id', nullable: true })
	organisationId?: string;

	@Column({ name: 'enrollment_id', type: 'uuid', nullable: true })
	enrollmentId?: string;

	@Column({ type: 'enum', enum: InvoiceType })
	type: InvoiceType;

	@Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.DRAFT })
	status: InvoiceStatus;

	@Column({ length: 3, default: 'KES' })
	currency: string;

	@Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
	subtotal: number;

	@Column({ name: 'discount_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
	discountPercent: number;

	@Column({ name: 'discount_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
	discountAmount: number;

	@Column({ name: 'tax_percent', type: 'decimal', precision: 5, scale: 2, default: 0 })
	taxPercent: number;

	@Column({ name: 'tax_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
	taxAmount: number;

	@Column({ name: 'total_amount', type: 'decimal', precision: 12, scale: 2, default: 0 })
	totalAmount: number;

	@Column({ name: 'amount_paid', type: 'decimal', precision: 12, scale: 2, default: 0 })
	amountPaid: number;

	@Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
	balance: number;

	@Column({ name: 'issue_date' })
	issueDate: Date;

	@Column({ name: 'due_date' })
	dueDate: Date;

	@Column({ name: 'paid_date', nullable: true })
	paidDate?: Date;

	@Column({ name: 'voided_date', nullable: true })
	voidedDate?: Date;

	@Column({ name: 'void_reason', nullable: true })
	voidReason?: string;

	@Column({ type: 'text', nullable: true })
	notes?: string;

	@Column({ name: 'created_by_employee_id' })
	createdByEmployeeId: string;

	@OneToMany(() => InvoiceLineItem, (lineItem) => lineItem.invoice, { cascade: true })
	lineItems: InvoiceLineItem[];

	@OneToMany(() => Payment, (payment) => payment.invoice)
	payments: Payment[];
}
