import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as https from 'https';

interface EmailAttachment {
	filename: string;
	content: Buffer | string; // Buffer or base64 string
}

interface SendEmailResponse {
	id: string;
}

@Injectable()
export class EmailService {
	private readonly logger = new Logger(EmailService.name);
	private readonly apiKey: string;
	private readonly fromEmail: string;
	private readonly fromName: string;
	private readonly httpsAgent: https.Agent;

	constructor(private readonly configService: ConfigService) {
		this.apiKey = this.configService.get<string>('RESEND_API_KEY', '');
		this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL', 'noreply@ispeakacademy.org');
		this.fromName = this.configService.get<string>('RESEND_FROM_NAME', 'iSpeak Academy');
		this.httpsAgent = new https.Agent({ family: 4 });
	}

	async sendEmail(to: string, subject: string, html: string, attachments?: EmailAttachment[]): Promise<SendEmailResponse> {
		try {
			const payload: any = {
				from: `${this.fromName} <${this.fromEmail}>`,
				to: [to],
				subject,
				html,
			};

			if (attachments && attachments.length > 0) {
				payload.attachments = attachments.map((a) => ({
					filename: a.filename,
					content: Buffer.isBuffer(a.content)
						? a.content.toString('base64')
						: a.content,
				}));
			}

			const response = await axios.post(
				'https://api.resend.com/emails',
				payload,
				{
					headers: {
						'Authorization': `Bearer ${this.apiKey}`,
						'Content-Type': 'application/json',
					},
					httpsAgent: this.httpsAgent,
					timeout: 30000,
				},
			);

			this.logger.log(`Email sent successfully to ${to}, Resend ID: ${response.data.id}`);

			return { id: response.data.id };
		} catch (error) {
			const message = error.response?.data?.message || error.message;
			this.logger.error(`Failed to send email to ${to}: ${message}`, error.stack);
			throw new Error(`Failed to send email: ${message}`);
		}
	}
}
