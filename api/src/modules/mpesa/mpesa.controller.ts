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
	HttpCode,
	HttpStatus,
	Logger,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiExcludeEndpoint,
	ApiOperation,
	ApiResponse,
	ApiSecurity,
	ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { StkPushDto } from './dto/stk-push.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { MpesaService } from './mpesa.service';

@Controller('mpesa')
@ApiTags('M-Pesa')
export class MpesaController {
	private readonly logger = new Logger(MpesaController.name);

	constructor(
		private readonly mpesaService: MpesaService,
		private readonly invoicesService: InvoicesService,
	) {}

	/**
	 * Initiate an M-Pesa STK Push payment for an invoice.
	 * Sends a payment prompt to the client's phone.
	 */
	@Post('stk-push')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.PAYMENTS, PermissionAction.CREATE))
	@ApiSecurity('bearer')
	@ApiBearerAuth('JWT')
	@ApiOperation({ summary: 'Initiate M-Pesa STK Push for an invoice' })
	@ApiResponse({ status: 200, description: 'STK Push initiated successfully' })
	@ApiResponse({ status: 400, description: 'Invalid request or STK Push failed' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
	async initiateSTKPush(
		@Body() stkPushDto: StkPushDto,
		@CurrentUser() user: JwtPayload,
	) {
		// Look up the invoice to get the invoice number
		const invoice = await this.invoicesService.findOne(stkPushDto.invoiceId);

		const result = await this.mpesaService.initiateSTKPush(
			stkPushDto.phoneNumber,
			stkPushDto.amount,
			invoice.invoiceNumber,
			stkPushDto.description,
		);

		return {
			success: true,
			data: {
				checkoutRequestId: result.CheckoutRequestID,
				merchantRequestId: result.MerchantRequestID,
				responseDescription: result.ResponseDescription,
				customerMessage: result.CustomerMessage,
			},
			message: 'STK Push initiated successfully. Check your phone to complete the payment.',
		};
	}

	/**
	 * M-Pesa STK Push callback endpoint.
	 * Called by Safaricom after the customer completes or cancels the payment.
	 * No authentication required — Safaricom calls this directly.
	 */
	@Post('callback/stk')
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async handleSTKCallback(@Req() req: Request) {
		this.logger.log('Received STK Push callback from Safaricom');

		const result = await this.mpesaService.handleSTKCallback(req.body);
		return result;
	}

	/**
	 * M-Pesa C2B confirmation callback endpoint.
	 * Called by Safaricom when a customer makes a Paybill payment.
	 * No authentication required — Safaricom calls this directly.
	 */
	@Post('callback/c2b/confirmation')
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async handleC2BConfirmation(@Req() req: Request) {
		this.logger.log('Received C2B confirmation callback from Safaricom');

		const result = await this.mpesaService.handleC2BConfirmation(req.body);
		return result;
	}

	/**
	 * M-Pesa C2B validation callback endpoint.
	 * Called by Safaricom before processing a Paybill payment.
	 * Accepts all transactions by returning ResultCode 0.
	 * No authentication required — Safaricom calls this directly.
	 */
	@Post('callback/c2b/validation')
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async handleC2BValidation() {
		this.logger.log('Received C2B validation request from Safaricom');

		return {
			ResultCode: 0,
			ResultDesc: 'Accepted',
		};
	}

	/**
	 * Register C2B confirmation and validation URLs with Safaricom.
	 * This must be called once during setup to enable Paybill payment callbacks.
	 */
	@Post('register-urls')
	@UseGuards(JwtAuthGuard, PermissionsGuard)
	@RequirePermissions(Permission(PermissionResource.SETTINGS, PermissionAction.UPDATE))
	@ApiSecurity('bearer')
	@ApiBearerAuth('JWT')
	@ApiOperation({ summary: 'Register M-Pesa C2B callback URLs with Safaricom' })
	@ApiResponse({ status: 200, description: 'C2B URLs registered successfully' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
	async registerC2BUrls(@CurrentUser() user: JwtPayload) {
		const result = await this.mpesaService.registerC2BUrls();

		return {
			success: true,
			data: result,
			message: 'C2B URLs registered successfully with Safaricom',
		};
	}
}
