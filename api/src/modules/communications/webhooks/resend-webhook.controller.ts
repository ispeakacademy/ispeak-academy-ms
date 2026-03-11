import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { CommunicationsService } from '../communications.service';

@Controller('webhooks')
export class ResendWebhookController {
	private readonly logger = new Logger(ResendWebhookController.name);

	constructor(private readonly communicationsService: CommunicationsService) {}

	@Post('resend')
	@HttpCode(HttpStatus.OK)
	@ApiExcludeEndpoint()
	async handleResendWebhook(@Body() payload: any) {
		this.logger.log(`Received Resend webhook event: ${payload?.type || 'unknown'}`);

		try {
			await this.communicationsService.handleResendWebhook(payload);
		} catch (error) {
			this.logger.error(`Error processing Resend webhook: ${error.message}`, error.stack);
		}

		return { received: true };
	}
}
