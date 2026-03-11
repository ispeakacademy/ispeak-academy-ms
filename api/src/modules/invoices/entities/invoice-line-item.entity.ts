import { AbstractEntity } from '@/database/abstract.entity';
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Invoice } from './invoice.entity';

@Entity('invoice_line_items')
export class InvoiceLineItem extends AbstractEntity<InvoiceLineItem> {
	@PrimaryGeneratedColumn('uuid', { name: 'line_item_id' })
	lineItemId: string;

	@Column({ name: 'invoice_id' })
	invoiceId: string;

	@Column()
	description: string;

	@Column({ name: 'program_id', nullable: true })
	programId?: string;

	@Column({ name: 'unit_price', type: 'decimal', precision: 12, scale: 2 })
	unitPrice: number;

	@Column({ type: 'int', default: 1 })
	quantity: number;

	@Column({ type: 'decimal', precision: 12, scale: 2 })
	total: number;

	@ManyToOne(() => Invoice, (invoice) => invoice.lineItems, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'invoice_id' })
	invoice: Invoice;
}
