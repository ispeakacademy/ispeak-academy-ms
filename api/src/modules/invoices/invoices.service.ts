import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import { EnrollmentStatus } from '@/common/enums/enrollment-status.enum';
import { InvoiceStatus } from '@/common/enums/invoice-status.enum';
import { PaymentStatus } from '@/common/enums/payment-status.enum';
import {
	BadRequestException,
	Inject,
	Injectable,
	Logger,
	NotFoundException,
	forwardRef,
} from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { EmailService } from '../communications/services/email.service';
import { EnrollmentsService } from '../enrollments/enrollments.service';
import { SettingsService } from '../settings/settings.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { Payment } from './entities/payment.entity';
import { InvoiceLineItemsRepository } from './repositories/invoice-line-items.repository';
import { InvoicesRepository } from './repositories/invoices.repository';
import { PaymentsRepository } from './repositories/payments.repository';
import { InvoicePdfService } from './services/invoice-pdf.service';

@Injectable()
export class InvoicesService {
	private readonly logger = new Logger(InvoicesService.name);

	constructor(
		private readonly invoicesRepository: InvoicesRepository,
		private readonly lineItemsRepository: InvoiceLineItemsRepository,
		private readonly paymentsRepository: PaymentsRepository,
		private readonly auditService: AuditService,
		private readonly emailService: EmailService,
		@Inject(forwardRef(() => EnrollmentsService))
		private readonly enrollmentsService: EnrollmentsService,
		private readonly settingsService: SettingsService,
		private readonly invoicePdfService: InvoicePdfService,
	) {}

	async create(dto: CreateInvoiceDto, userId: string): Promise<Invoice> {
		// Validate enrollment linkage if provided
		if (dto.enrollmentId) {
			const enrollment = await this.enrollmentsService.findOne(dto.enrollmentId);

			if (dto.clientId && enrollment.clientId !== dto.clientId) {
				throw new BadRequestException('Enrollment does not belong to the selected client');
			}

			if (
				enrollment.status !== EnrollmentStatus.APPROVED &&
				enrollment.status !== EnrollmentStatus.INVOICE_SENT
			) {
				throw new BadRequestException(
					`Enrollment status must be APPROVED or INVOICE_SENT to create an invoice. Current status: ${enrollment.status}`,
				);
			}

			const alreadyInvoiced = await this.invoicesRepository.getAlreadyInvoicedAmount(dto.enrollmentId);
			const remaining = Number(enrollment.agreedAmount) - alreadyInvoiced;

			// Calculate the new invoice total to validate against remaining
			const lineItemsTotal = (dto.lineItems || []).reduce((sum, item) => {
				const qty = item.quantity ?? 1;
				return sum + item.unitPrice * qty;
			}, 0);
			const discountPct = dto.discountPercent ?? 0;
			const discountAmt = (lineItemsTotal * discountPct) / 100;
			const afterDiscount = lineItemsTotal - discountAmt;
			const taxPct = dto.taxPercent ?? 0;
			const taxAmt = (afterDiscount * taxPct) / 100;
			const newTotal = Number((afterDiscount + taxAmt).toFixed(2));

			if (newTotal > remaining + 0.01) {
				throw new BadRequestException(
					`Invoice total (${newTotal}) exceeds remaining enrollment amount (${remaining.toFixed(2)}). Agreed: ${enrollment.agreedAmount}, Already invoiced: ${alreadyInvoiced.toFixed(2)}`,
				);
			}

			if (dto.currency && dto.currency !== enrollment.agreedCurrency) {
				throw new BadRequestException(
					`Invoice currency (${dto.currency}) must match enrollment currency (${enrollment.agreedCurrency})`,
				);
			}
		}

		const invoiceNumber = await this.invoicesRepository.generateInvoiceNumber();

		// Calculate subtotal from line items
		const lineItemsWithTotals = dto.lineItems.map((item) => {
			const quantity = item.quantity ?? 1;
			const total = Number((item.unitPrice * quantity).toFixed(2));
			return { ...item, quantity, total };
		});

		const subtotal = Number(
			lineItemsWithTotals.reduce((sum, item) => sum + item.total, 0).toFixed(2),
		);

		// Apply discount
		const discountPercent = dto.discountPercent ?? 0;
		const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
		const afterDiscount = Number((subtotal - discountAmount).toFixed(2));

		// Apply tax
		const taxPercent = dto.taxPercent ?? 0;
		const taxAmount = Number(((afterDiscount * taxPercent) / 100).toFixed(2));

		// Calculate total and balance
		const totalAmount = Number((afterDiscount + taxAmount).toFixed(2));
		const balance = totalAmount;

		// Create the invoice
		const invoice = await this.invoicesRepository.create({
			invoiceNumber,
			clientId: dto.clientId,
			organisationId: dto.organisationId,
			enrollmentId: dto.enrollmentId,
			type: dto.type,
			currency: dto.currency ?? 'KES',
			subtotal,
			discountPercent,
			discountAmount,
			taxPercent,
			taxAmount,
			totalAmount,
			amountPaid: 0,
			balance,
			issueDate: new Date(),
			dueDate: dto.dueDate,
			notes: dto.notes,
			createdByEmployeeId: userId,
			status: InvoiceStatus.DRAFT,
		});

		// Create line items
		for (const item of lineItemsWithTotals) {
			await this.lineItemsRepository.create({
				invoiceId: invoice.invoiceId,
				description: item.description,
				programId: item.programId,
				unitPrice: item.unitPrice,
				quantity: item.quantity,
				total: item.total,
			});
		}

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.INVOICE_CREATED,
			performedBy: userId,
			targetType: AuditTargetType.INVOICE,
			targetId: invoice.invoiceId,
			details: `Invoice ${invoiceNumber} created with total ${dto.currency ?? 'KES'} ${totalAmount}`,
			metadata: {
				invoiceNumber,
				clientId: dto.clientId,
				totalAmount,
				currency: dto.currency ?? 'KES',
			},
		});

		this.logger.log(`Invoice created: ${invoiceNumber} by user: ${userId}`);

		// Return invoice with line items
		return this.findOne(invoice.invoiceId);
	}

	async findAll(query: QueryInvoicesDto, currentUser?: JwtPayload) {
		const { page = 1, limit = 20, status, type, search, own } = query;
		let { clientId } = query;
		const skip = (page - 1) * limit;

		// When own=true, scope to the current user's linked client
		if (own && currentUser?.linkedClientId) {
			clientId = currentUser.linkedClientId;
		}

		const queryBuilder = this.invoicesRepository
			.createQueryBuilder('invoice')
			.leftJoinAndSelect('invoice.lineItems', 'lineItems')
			.leftJoin('invoice.client', 'client')
			.addSelect(['client.clientId', 'client.firstName', 'client.lastName', 'client.email', 'client.phone'])
			.where('invoice.deletedAt IS NULL')
			.orderBy('invoice.createdAt', 'DESC')
			.skip(skip)
			.take(limit);

		if (status) {
			queryBuilder.andWhere('invoice.status = :status', { status });
		}

		if (type) {
			queryBuilder.andWhere('invoice.type = :type', { type });
		}

		if (clientId) {
			queryBuilder.andWhere('invoice.clientId = :clientId', { clientId });
		}

		if (search) {
			queryBuilder.andWhere('invoice.invoiceNumber ILIKE :search', {
				search: `%${search}%`,
			});
		}

		const [invoices, total] = await queryBuilder.getManyAndCount();

		return {
			data: invoices,
			total,
			page,
			limit,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findOne(invoiceId: string): Promise<Invoice> {
		const invoice = await this.invoicesRepository.findOne({
			where: { invoiceId },
			relations: ['lineItems', 'payments', 'client'],
		});

		if (!invoice) {
			throw new NotFoundException(`Invoice with ID ${invoiceId} not found`);
		}

		return invoice;
	}

	async update(invoiceId: string, dto: UpdateInvoiceDto, userId: string): Promise<Invoice> {
		const invoice = await this.findOne(invoiceId);

		if (invoice.status !== InvoiceStatus.DRAFT) {
			throw new BadRequestException('Only draft invoices can be updated');
		}

		// If line items are provided, recalculate totals
		if (dto.lineItems && dto.lineItems.length > 0) {
			// Delete existing line items
			await this.lineItemsRepository.deleteByCriteria({ invoiceId } as any);

			// Create new line items and calculate subtotal
			const lineItemsWithTotals = dto.lineItems.map((item) => {
				const quantity = item.quantity ?? 1;
				const total = Number((item.unitPrice * quantity).toFixed(2));
				return { ...item, quantity, total };
			});

			const subtotal = Number(
				lineItemsWithTotals.reduce((sum, item) => sum + item.total, 0).toFixed(2),
			);

			const discountPercent = dto.discountPercent ?? invoice.discountPercent;
			const discountAmount = Number(((subtotal * Number(discountPercent)) / 100).toFixed(2));
			const afterDiscount = Number((subtotal - discountAmount).toFixed(2));

			const taxPercent = dto.taxPercent ?? invoice.taxPercent;
			const taxAmount = Number(((afterDiscount * Number(taxPercent)) / 100).toFixed(2));

			const totalAmount = Number((afterDiscount + taxAmount).toFixed(2));
			const balance = Number((totalAmount - Number(invoice.amountPaid)).toFixed(2));

			// Update invoice totals
			await this.invoicesRepository.update(
				{ invoiceId } as any,
				{
					clientId: dto.clientId ?? invoice.clientId,
					organisationId: dto.organisationId ?? invoice.organisationId,
					enrollmentId: dto.enrollmentId ?? invoice.enrollmentId,
					type: dto.type ?? invoice.type,
					currency: dto.currency ?? invoice.currency,
					subtotal,
					discountPercent,
					discountAmount,
					taxPercent,
					taxAmount,
					totalAmount,
					balance,
					dueDate: dto.dueDate ?? invoice.dueDate,
					notes: dto.notes ?? invoice.notes,
				} as any,
			);

			// Create new line items
			for (const item of lineItemsWithTotals) {
				await this.lineItemsRepository.create({
					invoiceId,
					description: item.description,
					programId: item.programId,
					unitPrice: item.unitPrice,
					quantity: item.quantity,
					total: item.total,
				});
			}
		} else {
			// Update without recalculating line items
			const updateData: any = {};

			if (dto.clientId !== undefined) updateData.clientId = dto.clientId;
			if (dto.organisationId !== undefined) updateData.organisationId = dto.organisationId;
			if (dto.enrollmentId !== undefined) updateData.enrollmentId = dto.enrollmentId;
			if (dto.type !== undefined) updateData.type = dto.type;
			if (dto.currency !== undefined) updateData.currency = dto.currency;
			if (dto.dueDate !== undefined) updateData.dueDate = dto.dueDate;
			if (dto.notes !== undefined) updateData.notes = dto.notes;

			// Recalculate if discount or tax changed
			if (dto.discountPercent !== undefined || dto.taxPercent !== undefined) {
				const subtotal = Number(invoice.subtotal);
				const discountPercent = dto.discountPercent ?? Number(invoice.discountPercent);
				const discountAmount = Number(((subtotal * discountPercent) / 100).toFixed(2));
				const afterDiscount = Number((subtotal - discountAmount).toFixed(2));

				const taxPercent = dto.taxPercent ?? Number(invoice.taxPercent);
				const taxAmount = Number(((afterDiscount * taxPercent) / 100).toFixed(2));

				const totalAmount = Number((afterDiscount + taxAmount).toFixed(2));
				const balance = Number((totalAmount - Number(invoice.amountPaid)).toFixed(2));

				updateData.discountPercent = discountPercent;
				updateData.discountAmount = discountAmount;
				updateData.taxPercent = taxPercent;
				updateData.taxAmount = taxAmount;
				updateData.totalAmount = totalAmount;
				updateData.balance = balance;
			}

			if (Object.keys(updateData).length > 0) {
				await this.invoicesRepository.update({ invoiceId } as any, updateData);
			}
		}

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.INVOICE_UPDATED,
			performedBy: userId,
			targetType: AuditTargetType.INVOICE,
			targetId: invoiceId,
			details: `Invoice ${invoice.invoiceNumber} updated`,
			metadata: { updatedFields: Object.keys(dto) },
		});

		this.logger.log(`Invoice updated: ${invoiceId} by user: ${userId}`);

		return this.findOne(invoiceId);
	}

	async sendInvoice(invoiceId: string, userId: string): Promise<Invoice> {
		const invoice = await this.findOne(invoiceId);

		if (invoice.status !== InvoiceStatus.DRAFT) {
			throw new BadRequestException('Only draft invoices can be sent');
		}

		// Update status to SENT
		await this.invoicesRepository.update(
			{ invoiceId } as any,
			{ status: InvoiceStatus.SENT } as any,
		);

		// Send email with PDF attachment to client
		if (invoice.client?.email) {
			try {
				const settings = await this.settingsService.getSettings();
				const pdfBuffer = await this.invoicePdfService.generatePdf(invoice, settings);
				const platformName = settings?.platformName || 'iSpeak Academy';

				const emailHtml = `
					<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
						<h2 style="color: ${settings?.primaryColor || '#000000'};">Invoice from ${platformName}</h2>
						<p>Dear ${invoice.client.firstName},</p>
						<p>Please find attached your invoice <strong>${invoice.invoiceNumber}</strong>.</p>
						<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
							<tr>
								<td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Invoice Number</td>
								<td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${invoice.invoiceNumber}</td>
							</tr>
							<tr>
								<td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Total Amount</td>
								<td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${invoice.currency} ${Number(invoice.totalAmount).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</td>
							</tr>
							<tr>
								<td style="padding: 8px; border-bottom: 1px solid #eee; color: #666;">Due Date</td>
								<td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">${new Date(invoice.dueDate).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
							</tr>
						</table>
						<p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
						<p>Best regards,<br/>${platformName}</p>
					</div>
				`;

				await this.emailService.sendEmail(
					invoice.client.email,
					`Invoice ${invoice.invoiceNumber} from ${platformName}`,
					emailHtml,
					[
						{
							filename: `${invoice.invoiceNumber}.pdf`,
							content: pdfBuffer,
						},
					],
				);

				this.logger.log(
					`Invoice email with PDF sent to ${invoice.client.email} for invoice ${invoice.invoiceNumber}`,
				);
			} catch (error) {
				this.logger.error(
					`Failed to send invoice email for ${invoice.invoiceNumber}: ${error.message}`,
					error.stack,
				);
				// Don't throw — the invoice status is already SENT, email failure shouldn't block that
			}
		} else {
			this.logger.warn(
				`No email address for client on invoice ${invoice.invoiceNumber}, skipping email`,
			);
		}

		// Transition enrollment status to INVOICE_SENT if linked
		if (invoice.enrollmentId) {
			try {
				const enrollment = await this.enrollmentsService.findOne(invoice.enrollmentId);
				if (enrollment.status === EnrollmentStatus.APPROVED) {
					await this.enrollmentsService.markInvoiceSent(invoice.enrollmentId, userId);
					this.logger.log(
						`Enrollment ${invoice.enrollmentId} transitioned to INVOICE_SENT for invoice ${invoice.invoiceNumber}`,
					);
				}
			} catch (error) {
				this.logger.warn(
					`Failed to transition enrollment ${invoice.enrollmentId} to INVOICE_SENT: ${error.message}`,
				);
			}
		}

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.INVOICE_SENT,
			performedBy: userId,
			targetType: AuditTargetType.INVOICE,
			targetId: invoiceId,
			details: `Invoice ${invoice.invoiceNumber} sent to client`,
			metadata: {
				invoiceNumber: invoice.invoiceNumber,
				clientId: invoice.clientId,
				totalAmount: invoice.totalAmount,
			},
		});

		this.logger.log(`Invoice sent: ${invoiceId} by user: ${userId}`);

		return this.findOne(invoiceId);
	}

	async voidInvoice(invoiceId: string, reason: string, userId: string): Promise<Invoice> {
		const invoice = await this.findOne(invoiceId);

		if (invoice.status === InvoiceStatus.VOID) {
			throw new BadRequestException('Invoice is already voided');
		}

		if (invoice.status === InvoiceStatus.PAID) {
			throw new BadRequestException('Cannot void a fully paid invoice. Reverse payments first.');
		}

		await this.invoicesRepository.update(
			{ invoiceId } as any,
			{
				status: InvoiceStatus.VOID,
				voidedDate: new Date(),
				voidReason: reason,
			} as any,
		);

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.INVOICE_VOIDED,
			performedBy: userId,
			targetType: AuditTargetType.INVOICE,
			targetId: invoiceId,
			details: `Invoice ${invoice.invoiceNumber} voided. Reason: ${reason}`,
			metadata: {
				invoiceNumber: invoice.invoiceNumber,
				reason,
				previousStatus: invoice.status,
			},
		});

		this.logger.log(`Invoice voided: ${invoiceId} by user: ${userId}`);

		return this.findOne(invoiceId);
	}

	async recordPayment(invoiceId: string, dto: RecordPaymentDto, userId: string): Promise<Payment> {
		const invoice = await this.findOne(invoiceId);

		if (invoice.status === InvoiceStatus.VOID) {
			throw new BadRequestException('Cannot record payment for a voided invoice');
		}

		if (invoice.status === InvoiceStatus.PAID) {
			throw new BadRequestException('Invoice is already fully paid');
		}

		if (dto.amount > Number(invoice.balance)) {
			throw new BadRequestException(
				`Payment amount (${dto.amount}) exceeds invoice balance (${invoice.balance})`,
			);
		}

		// Create payment record
		const payment = await this.paymentsRepository.create({
			invoiceId,
			amount: dto.amount,
			currency: dto.currency ?? invoice.currency,
			method: dto.method,
			status: PaymentStatus.CONFIRMED,
			externalReference: dto.externalReference,
			payerName: dto.payerName,
			paymentDate: dto.paymentDate,
			notes: dto.notes,
			recordedByEmployeeId: userId,
			isAutoReconciled: false,
		});

		// Update invoice financials
		const newAmountPaid = Number((Number(invoice.amountPaid) + dto.amount).toFixed(2));
		const newBalance = Number((Number(invoice.totalAmount) - newAmountPaid).toFixed(2));

		let newStatus: InvoiceStatus;
		if (newBalance <= 0) {
			newStatus = InvoiceStatus.PAID;
		} else if (newAmountPaid > 0) {
			newStatus = InvoiceStatus.PARTIAL;
		} else {
			newStatus = invoice.status;
		}

		const updateData: any = {
			amountPaid: newAmountPaid,
			balance: newBalance,
			status: newStatus,
		};

		if (newStatus === InvoiceStatus.PAID) {
			updateData.paidDate = new Date();
		}

		await this.invoicesRepository.update({ invoiceId } as any, updateData);

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.PAYMENT_RECORDED,
			performedBy: userId,
			targetType: AuditTargetType.PAYMENT,
			targetId: payment.paymentId,
			details: `Payment of ${dto.currency ?? invoice.currency} ${dto.amount} recorded for invoice ${invoice.invoiceNumber}`,
			metadata: {
				invoiceId,
				invoiceNumber: invoice.invoiceNumber,
				paymentAmount: dto.amount,
				paymentMethod: dto.method,
				newBalance,
				newStatus,
			},
		});

		this.logger.log(
			`Payment recorded: ${payment.paymentId} for invoice ${invoiceId} by user: ${userId}`,
		);

		return payment;
	}

	async reversePayment(paymentId: string, userId: string): Promise<Payment> {
		const payment = await this.paymentsRepository.findOne({
			where: { paymentId },
		});

		if (!payment) {
			throw new NotFoundException(`Payment with ID ${paymentId} not found`);
		}

		if (payment.status === PaymentStatus.REVERSED) {
			throw new BadRequestException('Payment is already reversed');
		}

		// Mark payment as reversed
		await this.paymentsRepository.update(
			{ paymentId } as any,
			{ status: PaymentStatus.REVERSED } as any,
		);

		// Recalculate invoice balance
		const invoice = await this.findOne(payment.invoiceId);

		// Sum all confirmed payments (excluding the reversed one)
		const confirmedPayments = (invoice.payments || []).filter(
			(p) => p.paymentId !== paymentId && p.status === PaymentStatus.CONFIRMED,
		);
		const totalConfirmedPaid = Number(
			confirmedPayments.reduce((sum, p) => sum + Number(p.amount), 0).toFixed(2),
		);
		const newBalance = Number((Number(invoice.totalAmount) - totalConfirmedPaid).toFixed(2));

		let newStatus: InvoiceStatus;
		if (totalConfirmedPaid <= 0) {
			newStatus = InvoiceStatus.SENT;
		} else if (newBalance > 0) {
			newStatus = InvoiceStatus.PARTIAL;
		} else {
			newStatus = InvoiceStatus.PAID;
		}

		const updateData: any = {
			amountPaid: totalConfirmedPaid,
			balance: newBalance,
			status: newStatus,
		};

		// Clear paid date if no longer fully paid
		if (newStatus !== InvoiceStatus.PAID) {
			updateData.paidDate = null;
		}

		await this.invoicesRepository.update({ invoiceId: payment.invoiceId } as any, updateData);

		// Audit log
		await this.auditService.createLog({
			action: AuditAction.PAYMENT_REVERSED,
			performedBy: userId,
			targetType: AuditTargetType.PAYMENT,
			targetId: paymentId,
			details: `Payment of ${payment.currency} ${payment.amount} reversed for invoice ${invoice.invoiceNumber}`,
			metadata: {
				invoiceId: payment.invoiceId,
				invoiceNumber: invoice.invoiceNumber,
				reversedAmount: payment.amount,
				newBalance,
				newStatus,
			},
		});

		this.logger.log(`Payment reversed: ${paymentId} by user: ${userId}`);

		return this.paymentsRepository.findOne({ where: { paymentId } });
	}

	async getOverdue() {
		const now = new Date();

		const queryBuilder = this.invoicesRepository
			.createQueryBuilder('invoice')
			.leftJoinAndSelect('invoice.lineItems', 'lineItems')
			.leftJoin('invoice.client', 'client')
			.addSelect(['client.clientId', 'client.firstName', 'client.lastName', 'client.email'])
			.where('invoice.deletedAt IS NULL')
			.andWhere('invoice.status IN (:...statuses)', {
				statuses: [InvoiceStatus.SENT, InvoiceStatus.PARTIAL],
			})
			.andWhere('invoice.dueDate < :now', { now })
			.orderBy('invoice.dueDate', 'ASC');

		const overdueInvoices = await queryBuilder.getMany();

		return {
			data: overdueInvoices,
			total: overdueInvoices.length,
		};
	}

	async getClientInvoices(clientId: string) {
		const invoices = await this.invoicesRepository.findAll({
			where: { clientId },
			relations: ['lineItems', 'payments'],
			order: { createdAt: 'DESC' },
		});

		return {
			data: invoices,
			total: invoices.length,
		};
	}

	async getClientStatement(clientId: string) {
		const invoices = await this.invoicesRepository.findAll({
			where: { clientId },
			relations: ['lineItems', 'payments'],
			order: { createdAt: 'ASC' },
		});

		// Calculate summary
		const totalInvoiced = Number(
			invoices.reduce((sum, inv) => sum + Number(inv.totalAmount), 0).toFixed(2),
		);
		const totalPaid = Number(
			invoices.reduce((sum, inv) => sum + Number(inv.amountPaid), 0).toFixed(2),
		);
		const totalOutstanding = Number((totalInvoiced - totalPaid).toFixed(2));

		// Collect all payments across invoices
		const allPayments = invoices
			.flatMap((inv) =>
				(inv.payments || []).map((p) => ({
					...p,
					invoiceNumber: inv.invoiceNumber,
				})),
			)
			.sort(
				(a, b) =>
					new Date(a.paymentDate).getTime() - new Date(b.paymentDate).getTime(),
			);

		return {
			clientId,
			summary: {
				totalInvoiced,
				totalPaid,
				totalOutstanding,
				invoiceCount: invoices.length,
			},
			invoices,
			payments: allPayments,
		};
	}

	async getInvoicePayments(invoiceId: string) {
		// Verify invoice exists
		await this.findOne(invoiceId);

		const payments = await this.paymentsRepository.findAll({
			where: { invoiceId },
			order: { createdAt: 'DESC' },
		});

		return {
			data: payments,
			total: payments.length,
		};
	}

	async getEnrollmentInvoicedAmount(enrollmentId: string) {
		const enrollment = await this.enrollmentsService.findOne(enrollmentId);
		const alreadyInvoiced = await this.invoicesRepository.getAlreadyInvoicedAmount(enrollmentId);
		const agreedAmount = Number(enrollment.agreedAmount);
		const remaining = Number((agreedAmount - alreadyInvoiced).toFixed(2));

		return {
			alreadyInvoiced,
			agreedAmount,
			remaining: Math.max(remaining, 0),
			agreedCurrency: enrollment.agreedCurrency,
		};
	}

	async getPaymentById(paymentId: string): Promise<Payment> {
		const payment = await this.paymentsRepository.findOne({
			where: { paymentId },
			relations: ['invoice'],
		});

		if (!payment) {
			throw new NotFoundException(`Payment with ID ${paymentId} not found`);
		}

		return payment;
	}
}
