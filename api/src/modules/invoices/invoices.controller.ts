import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
	Permission,
	RequirePermissions,
} from '@/common/decorators/permissions.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { PermissionsGuard } from '@/common/guards/permissions.guard';
import { JwtPayload } from '@/common/interfaces/jwt-payload.interface';
import {
	PermissionAction,
	PermissionResource,
} from '@/modules/permissions/entities/permission.entity';
import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@ApiTags('Invoices')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class InvoicesController {
	constructor(private readonly invoicesService: InvoicesService) {}

	@Post()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.INVOICES, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Create a new invoice' })
	async create(
		@Body() createInvoiceDto: CreateInvoiceDto,
		@CurrentUser() user: JwtPayload,
	) {
		const invoice = await this.invoicesService.create(createInvoiceDto, user.sub);
		return {
			success: true,
			data: invoice,
			message: 'Invoice created successfully',
		};
	}

	@Get()
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.INVOICES, PermissionAction.READ))
	@ApiOperation({ summary: 'List invoices with filters and pagination' })
	async findAll(
		@Query() query: QueryInvoicesDto,
		@CurrentUser() user: JwtPayload,
	) {
		return await this.invoicesService.findAll(query, user);
	}

	@Get('overdue')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.INVOICES, PermissionAction.READ))
	@ApiOperation({ summary: 'List overdue invoices' })
	async getOverdue() {
		const result = await this.invoicesService.getOverdue();
		return {
			success: true,
			data: result.data,
			total: result.total,
		};
	}

	@Get('enrollment/:enrollmentId/invoiced-amount')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.INVOICES, PermissionAction.READ))
	@ApiOperation({ summary: 'Get already invoiced amount for an enrollment' })
	async getEnrollmentInvoicedAmount(@Param('enrollmentId') enrollmentId: string) {
		const result = await this.invoicesService.getEnrollmentInvoicedAmount(enrollmentId);
		return {
			success: true,
			data: result,
		};
	}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.INVOICES, PermissionAction.READ))
	@ApiOperation({ summary: 'Get an invoice by ID' })
	async findOne(@Param('id') id: string) {
		const invoice = await this.invoicesService.findOne(id);
		return {
			success: true,
			data: invoice,
		};
	}

	@Patch(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.INVOICES, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Update a draft invoice' })
	async update(
		@Param('id') id: string,
		@Body() updateInvoiceDto: UpdateInvoiceDto,
		@CurrentUser() user: JwtPayload,
	) {
		const invoice = await this.invoicesService.update(id, updateInvoiceDto, user.sub);
		return {
			success: true,
			data: invoice,
			message: 'Invoice updated successfully',
		};
	}

	@Post(':id/send')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.INVOICES, PermissionAction.SEND))
	@ApiOperation({ summary: 'Send an invoice to the client' })
	async sendInvoice(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		const invoice = await this.invoicesService.sendInvoice(id, user.sub);
		return {
			success: true,
			data: invoice,
			message: 'Invoice sent successfully',
		};
	}

	@Post(':id/void')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.INVOICES, PermissionAction.VOID))
	@ApiOperation({ summary: 'Void an invoice' })
	async voidInvoice(
		@Param('id') id: string,
		@Body('reason') reason: string,
		@CurrentUser() user: JwtPayload,
	) {
		const invoice = await this.invoicesService.voidInvoice(id, reason, user.sub);
		return {
			success: true,
			data: invoice,
			message: 'Invoice voided successfully',
		};
	}

	@Post(':id/record-payment')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PAYMENTS, PermissionAction.CREATE))
	@ApiOperation({ summary: 'Record a payment against an invoice' })
	async recordPayment(
		@Param('id') id: string,
		@Body() recordPaymentDto: RecordPaymentDto,
		@CurrentUser() user: JwtPayload,
	) {
		const payment = await this.invoicesService.recordPayment(id, recordPaymentDto, user.sub);
		return {
			success: true,
			data: payment,
			message: 'Payment recorded successfully',
		};
	}

	@Get(':id/payments')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PAYMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'List payments for an invoice' })
	async getInvoicePayments(@Param('id') id: string) {
		const result = await this.invoicesService.getInvoicePayments(id);
		return {
			success: true,
			data: result.data,
			total: result.total,
		};
	}
}

@Controller('payments')
@ApiTags('Payments')
@ApiSecurity('bearer')
@ApiBearerAuth('JWT')
export class PaymentsController {
	constructor(private readonly invoicesService: InvoicesService) {}

	@Get(':id')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PAYMENTS, PermissionAction.READ))
	@ApiOperation({ summary: 'Get payment details by ID' })
	async findOne(@Param('id') id: string) {
		const payment = await this.invoicesService.getPaymentById(id);
		return {
			success: true,
			data: payment,
		};
	}

	@Post(':id/reverse')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PAYMENTS, PermissionAction.UPDATE))
	@ApiOperation({ summary: 'Reverse a payment' })
	async reversePayment(
		@Param('id') id: string,
		@CurrentUser() user: JwtPayload,
	) {
		const payment = await this.invoicesService.reversePayment(id, user.sub);
		return {
			success: true,
			data: payment,
			message: 'Payment reversed successfully',
		};
	}
}
