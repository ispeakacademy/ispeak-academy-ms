import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface SendSmsResponse {
	messageId: string;
	status: string;
	statusCode: number;
	cost?: string;
}

interface SendWhatsAppResponse {
	messageId: string;
	status: string;
}

@Injectable()
export class AfricasTalkingService {
	private readonly logger = new Logger(AfricasTalkingService.name);
	private readonly sms: any;
	private readonly shortcode: string;

	constructor(private readonly configService: ConfigService) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const AfricasTalking = require('africastalking');
		const at = AfricasTalking({
			apiKey: this.configService.get<string>('AT_API_KEY'),
			username: this.configService.get<string>('AT_USERNAME'),
		});
		this.sms = at.SMS;
		this.shortcode = this.configService.get<string>('AT_SMS_SHORTCODE', '');
	}

	private normalizePhone(phone: string): string {
		const cleaned = phone.replace(/[^0-9+]/g, '');
		if (cleaned.startsWith('+254')) return cleaned.substring(1);
		if (cleaned.startsWith('254')) return cleaned;
		if (cleaned.startsWith('0')) return `254${cleaned.substring(1)}`;
		return cleaned;
	}

	/**
	 * Send an SMS message via Africa's Talking.
	 * Accepts phone numbers in any format — normalizes to E.164 internally.
	 */
	async sendSms(to: string, message: string): Promise<SendSmsResponse> {
		const normalized = this.normalizePhone(to);

		const options: any = {
			to: [`+${normalized}`],
			message,
		};
		if (this.shortcode) {
			options.from = this.shortcode;
		}

		try {
			const result = await this.sms.send(options);
			const recipient = result?.SMSMessageData?.Recipients?.[0];

			if (!recipient) {
				const apiMessage = result?.SMSMessageData?.Message || 'No recipients returned';
				throw new Error(apiMessage);
			}

			const response: SendSmsResponse = {
				messageId: recipient.messageId,
				status: recipient.status,
				statusCode: recipient.statusCode,
				cost: recipient.cost,
			};

			if (recipient.statusCode === 101) {
				this.logger.log(
					`SMS sent to +${normalized} — messageId: ${response.messageId}, cost: ${response.cost}`,
				);
			} else {
				this.logger.warn(
					`SMS to +${normalized} status: ${response.status} (code: ${response.statusCode})`,
				);
				throw new Error(`SMS delivery failed: ${response.status} (code: ${response.statusCode})`);
			}

			return response;
		} catch (error) {
			this.logger.error(`Failed to send SMS to +${normalized}: ${error.message}`, error.stack);
			throw new Error(`Failed to send SMS: ${error.message}`);
		}
	}

	/**
	 * Send a WhatsApp message via Africa's Talking.
	 * Uses the SMS SDK with channel parameter set to 'whatsapp'.
	 * Note: WhatsApp Business API requires approved templates for business-initiated conversations.
	 */
	async sendWhatsApp(to: string, message: string): Promise<SendWhatsAppResponse> {
		const normalized = this.normalizePhone(to);

		const options: any = {
			to: [`+${normalized}`],
			message,
			channel: 'whatsapp',
		};

		try {
			const result = await this.sms.send(options);
			const recipient = result?.SMSMessageData?.Recipients?.[0];

			if (!recipient) {
				const apiMessage = result?.SMSMessageData?.Message || 'No recipients returned';
				throw new Error(apiMessage);
			}

			const response: SendWhatsAppResponse = {
				messageId: recipient.messageId,
				status: recipient.status,
			};

			if (recipient.statusCode <= 101) {
				this.logger.log(
					`WhatsApp message sent to +${normalized} — messageId: ${response.messageId}`,
				);
			} else {
				this.logger.warn(
					`WhatsApp to +${normalized} status: ${response.status} (code: ${recipient.statusCode})`,
				);
				throw new Error(`WhatsApp delivery failed: ${response.status} (code: ${recipient.statusCode})`);
			}

			return response;
		} catch (error) {
			this.logger.error(`Failed to send WhatsApp to +${normalized}: ${error.message}`, error.stack);
			throw new Error(`Failed to send WhatsApp message: ${error.message}`);
		}
	}
}
