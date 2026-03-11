import { AbstractRepository } from '@/database/abstract.repository';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from '../entities/invoice.entity';

@Injectable()
export class InvoicesRepository extends AbstractRepository<Invoice> {
	constructor(
		@InjectRepository(Invoice)
		private readonly invoiceRepository: Repository<Invoice>,
	) {
		super(invoiceRepository);
	}

	createQueryBuilder(alias: string) {
		return this.invoiceRepository.createQueryBuilder(alias);
	}

	/**
	 * Sums totalAmount for all non-voided invoices linked to an enrollment.
	 */
	async getAlreadyInvoicedAmount(enrollmentId: string): Promise<number> {
		const result = await this.invoiceRepository
			.createQueryBuilder('invoice')
			.select('COALESCE(SUM(invoice.totalAmount), 0)', 'total')
			.where('invoice.enrollmentId = :enrollmentId', { enrollmentId })
			.andWhere('invoice.status != :voidStatus', { voidStatus: 'void' })
			.getRawOne();
		return parseFloat(result.total);
	}

	/**
	 * Generates the next sequential invoice number for the current year.
	 * Format: ISP-YYYY-NNNN (e.g., ISP-2025-0001)
	 */
	async generateInvoiceNumber(): Promise<string> {
		const currentYear = new Date().getFullYear();
		const prefix = `ISP-${currentYear}-`;

		const latestInvoice = await this.invoiceRepository
			.createQueryBuilder('invoice')
			.where('invoice.invoice_number LIKE :prefix', { prefix: `${prefix}%` })
			.orderBy('invoice.invoice_number', 'DESC')
			.getOne();

		let nextSequence = 1;

		if (latestInvoice) {
			const lastNumber = latestInvoice.invoiceNumber.replace(prefix, '');
			const parsed = parseInt(lastNumber, 10);
			if (!isNaN(parsed)) {
				nextSequence = parsed + 1;
			}
		}

		const paddedSequence = nextSequence.toString().padStart(4, '0');
		return `${prefix}${paddedSequence}`;
	}
}
