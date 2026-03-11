import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { CommunicationsService } from '../communications.service';

/**
 * Africa's Talking webhook controller.
 * Receives inbound SMS/WhatsApp messages and delivery reports.
 * No auth — Africa's Talking calls these endpoints directly.
 */
@Controller('webhooks/africas-talking')
export class AfricasTalkingWebhookController {
	private readonly logger = new Logger(AfricasTalkingWebhookController.name);

	constructor(private readonly communicationsService: CommunicationsService) {}

	/**
	 * Inbound SMS callback.
	 * Africa's Talking POSTs form-urlencoded data with fields:
	 * - from: sender phone number
	 * - to: shortcode/number that received the message
	 * - text: message body
	 * - id: Africa's Talking message ID
	 * - date: timestamp
	 * - linkId: (optional) for premium SMS
	 */
	@Post('sms')
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async handleInboundSms(@Body() payload: any) {
		this.logger.log(`Received inbound SMS from ${payload?.from}`);

		try {
			await this.communicationsService.handleAfricasTalkingInbound(payload, 'sms');
		} catch (error) {
			this.logger.error(`Error processing inbound SMS: ${error.message}`, error.stack);
		}

		return { received: true };
	}

	/**
	 * Inbound WhatsApp callback.
	 * Similar payload to SMS but delivered via WhatsApp channel.
	 */
	@Post('whatsapp')
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async handleInboundWhatsApp(@Body() payload: any) {
		this.logger.log(`Received inbound WhatsApp from ${payload?.from}`);

		try {
			await this.communicationsService.handleAfricasTalkingInbound(payload, 'whatsapp');
		} catch (error) {
			this.logger.error(`Error processing inbound WhatsApp: ${error.message}`, error.stack);
		}

		return { received: true };
	}

	/**
	 * SMS delivery report callback.
	 * Africa's Talking POSTs form-urlencoded data with fields:
	 * - id: Africa's Talking message ID
	 * - status: Success | Failed | Rejected | etc.
	 * - failureReason: (optional) reason for failure
	 * - phoneNumber: recipient
	 * - networkCode: mobile network code
	 */
	@Post('delivery-report')
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async handleDeliveryReport(@Body() payload: any) {
		this.logger.log(`Received delivery report for message ${payload?.id}: ${payload?.status}`);

		try {
			await this.communicationsService.handleAfricasTalkingDeliveryReport(payload);
		} catch (error) {
			this.logger.error(`Error processing delivery report: ${error.message}`, error.stack);
		}

		return { received: true };
	}
}
