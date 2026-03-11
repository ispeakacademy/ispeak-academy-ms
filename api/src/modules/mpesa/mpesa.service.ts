import { AuditAction } from '@/common/enums/audit-action.enum';
import { AuditTargetType } from '@/common/enums/audit-target-type.enum';
import { PaymentMethod } from '@/common/enums/payment-method.enum';
import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
	Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import { InvoicesService } from '../invoices/invoices.service';

interface MpesaAccessTokenResponse {
	access_token: string;
	expires_in: string;
}

interface MpesaStkPushResponse {
	MerchantRequestID: string;
	CheckoutRequestID: string;
	ResponseCode: string;
	ResponseDescription: string;
	CustomerMessage: string;
}

interface MpesaStkCallbackMetadataItem {
	Name: string;
	Value?: string | number;
}

interface MpesaStkCallbackBody {
	Body: {
		stkCallback: {
			MerchantRequestID: string;
			CheckoutRequestID: string;
			ResultCode: number;
			ResultDesc: string;
			CallbackMetadata?: {
				Item: MpesaStkCallbackMetadataItem[];
			};
		};
	};
}

interface MpesaC2BConfirmationData {
	TransactionType: string;
	TransID: string;
	TransTime: string;
	TransAmount: string;
	BusinessShortCode: string;
	BillRefNumber: string;
	InvoiceNumber: string;
	OrgAccountBalance: string;
	ThirdPartyTransID: string;
	MSISDN: string;
	FirstName: string;
	MiddleName: string;
	LastName: string;
}

export interface MpesaC2BRegisterResponse {
	OriginatorConversationID: string;
	ConversationID: string;
	ResponseDescription: string;
}

@Injectable()
export class MpesaService {
	private readonly logger = new Logger(MpesaService.name);

	private cachedAccessToken: string | null = null;
	private tokenExpiresAt: number = 0;

	constructor(
		private readonly configService: ConfigService,
		private readonly invoicesService: InvoicesService,
		private readonly auditService: AuditService,
	) {}

	/**
	 * Returns the base URL for Daraja API based on environment configuration.
	 */
	private getBaseUrl(): string {
		const environment = this.configService.get<string>('MPESA_ENVIRONMENT', 'sandbox');
		return environment === 'production'
			? 'https://api.safaricom.co.ke'
			: 'https://sandbox.safaricom.co.ke';
	}

	/**
	 * Obtains an OAuth access token from the Daraja API.
	 * Caches the token for 50 minutes (Daraja tokens last 1 hour).
	 */
	private async getAccessToken(): Promise<string> {
		const now = Date.now();

		// Return cached token if still valid
		if (this.cachedAccessToken && now < this.tokenExpiresAt) {
			return this.cachedAccessToken;
		}

		const consumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY');
		const consumerSecret = this.configService.get<string>('MPESA_CONSUMER_SECRET');

		if (!consumerKey || !consumerSecret) {
			throw new InternalServerErrorException(
				'M-Pesa consumer key and secret are not configured',
			);
		}

		const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
		const baseUrl = this.getBaseUrl();
		const url = `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`;

		try {
			const response = await fetch(url, {
				method: 'GET',
				headers: {
					Authorization: `Basic ${credentials}`,
				},
			});

			if (!response.ok) {
				const errorBody = await response.text();
				this.logger.error(
					`Failed to obtain M-Pesa access token: ${response.status} ${errorBody}`,
				);
				throw new InternalServerErrorException('Failed to obtain M-Pesa access token');
			}

			const data = (await response.json()) as MpesaAccessTokenResponse;

			// Cache token for 50 minutes (3,000,000 ms)
			this.cachedAccessToken = data.access_token;
			this.tokenExpiresAt = now + 50 * 60 * 1000;

			this.logger.log('M-Pesa access token obtained successfully');

			return data.access_token;
		} catch (error) {
			if (error instanceof InternalServerErrorException) {
				throw error;
			}
			this.logger.error('Error obtaining M-Pesa access token', error);
			throw new InternalServerErrorException('Failed to connect to M-Pesa API');
		}
	}

	/**
	 * Generates a timestamp in the format YYYYMMDDHHMMSS required by Daraja API.
	 */
	private generateTimestamp(): string {
		const now = new Date();
		const year = now.getFullYear().toString();
		const month = (now.getMonth() + 1).toString().padStart(2, '0');
		const day = now.getDate().toString().padStart(2, '0');
		const hours = now.getHours().toString().padStart(2, '0');
		const minutes = now.getMinutes().toString().padStart(2, '0');
		const seconds = now.getSeconds().toString().padStart(2, '0');

		return `${year}${month}${day}${hours}${minutes}${seconds}`;
	}

	/**
	 * Generates the password for STK Push requests.
	 * Password = base64(BusinessShortCode + Passkey + Timestamp)
	 */
	private generatePassword(timestamp: string): string {
		const shortCode = this.configService.get<string>('MPESA_PAYBILL_NUMBER');
		const passkey = this.configService.get<string>('MPESA_PASSKEY');

		if (!shortCode || !passkey) {
			throw new InternalServerErrorException(
				'M-Pesa paybill number and passkey are not configured',
			);
		}

		return Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');
	}

	/**
	 * Initiates an STK Push (Lipa Na M-Pesa Online) request.
	 * This sends a payment prompt to the client's phone.
	 *
	 * @param phoneNumber - Kenyan phone number in format 254XXXXXXXXX
	 * @param amount - Payment amount in KES
	 * @param invoiceNumber - Invoice number used as account reference
	 * @param description - Optional transaction description
	 * @returns Daraja STK Push response containing CheckoutRequestID
	 */
	async initiateSTKPush(
		phoneNumber: string,
		amount: number,
		invoiceNumber: string,
		description?: string,
	): Promise<MpesaStkPushResponse> {
		const accessToken = await this.getAccessToken();
		const baseUrl = this.getBaseUrl();
		const shortCode = this.configService.get<string>('MPESA_PAYBILL_NUMBER');
		const callbackUrl = this.configService.get<string>('MPESA_CALLBACK_URL');

		if (!shortCode) {
			throw new InternalServerErrorException('M-Pesa paybill number is not configured');
		}

		if (!callbackUrl) {
			throw new InternalServerErrorException('M-Pesa callback URL is not configured');
		}

		const timestamp = this.generateTimestamp();
		const password = this.generatePassword(timestamp);
		const transactionDesc = description || `Payment for invoice ${invoiceNumber}`;

		const requestBody = {
			BusinessShortCode: shortCode,
			Password: password,
			Timestamp: timestamp,
			TransactionType: 'CustomerPayBillOnline',
			Amount: Math.ceil(amount),
			PartyA: phoneNumber,
			PartyB: shortCode,
			PhoneNumber: phoneNumber,
			CallBackURL: callbackUrl,
			AccountReference: invoiceNumber,
			TransactionDesc: transactionDesc,
		};

		try {
			const response = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(requestBody),
			});

			const responseData = (await response.json()) as MpesaStkPushResponse;

			if (!response.ok || responseData.ResponseCode !== '0') {
				this.logger.error(
					`STK Push request failed: ${JSON.stringify(responseData)}`,
				);
				throw new BadRequestException(
					responseData.ResponseDescription || 'STK Push request failed',
				);
			}

			// Audit log
			await this.auditService.createLog({
				action: AuditAction.STK_PUSH_INITIATED,
				performedBy: 'system',
				targetType: AuditTargetType.PAYMENT,
				targetId: responseData.CheckoutRequestID,
				details: `STK Push initiated for invoice ${invoiceNumber} — KES ${Math.ceil(amount)} to ${phoneNumber}`,
				metadata: {
					phoneNumber,
					amount: Math.ceil(amount),
					invoiceNumber,
					checkoutRequestId: responseData.CheckoutRequestID,
					merchantRequestId: responseData.MerchantRequestID,
				},
			});

			this.logger.log(
				`STK Push initiated: CheckoutRequestID=${responseData.CheckoutRequestID}, Invoice=${invoiceNumber}`,
			);

			return responseData;
		} catch (error) {
			if (
				error instanceof BadRequestException ||
				error instanceof InternalServerErrorException
			) {
				throw error;
			}
			this.logger.error('Error initiating STK Push', error);
			throw new InternalServerErrorException('Failed to initiate M-Pesa STK Push');
		}
	}

	/**
	 * Handles the STK Push callback from Safaricom.
	 * On success, records the payment against the matching invoice.
	 * On failure, logs the failed attempt for audit purposes.
	 *
	 * @param callbackData - The callback body sent by Safaricom
	 * @returns Acknowledgement response for Safaricom
	 */
	async handleSTKCallback(
		callbackData: MpesaStkCallbackBody,
	): Promise<{ ResultCode: number; ResultDesc: string }> {
		try {
			const stkCallback = callbackData.Body.stkCallback;
			const {
				MerchantRequestID,
				CheckoutRequestID,
				ResultCode,
				ResultDesc,
			} = stkCallback;

			this.logger.log(
				`STK Callback received: CheckoutRequestID=${CheckoutRequestID}, ResultCode=${ResultCode}, ResultDesc=${ResultDesc}`,
			);

			if (ResultCode === 0) {
				// Payment successful — extract metadata
				const metadata = stkCallback.CallbackMetadata?.Item || [];

				const getMetadataValue = (name: string): string | number | undefined => {
					const item = metadata.find((m) => m.Name === name);
					return item?.Value;
				};

				const mpesaReceiptNumber = getMetadataValue('MpesaReceiptNumber') as string;
				const amount = getMetadataValue('Amount') as number;
				const transactionDate = getMetadataValue('TransactionDate') as string | number;
				const phoneNumber = getMetadataValue('PhoneNumber') as string | number;

				this.logger.log(
					`STK Push successful: Receipt=${mpesaReceiptNumber}, Amount=${amount}, Phone=${phoneNumber}`,
				);

				// Find the invoice by matching the account reference
				// The AccountReference was set to the invoice number during STK Push initiation
				// We need to find the invoice — the CheckoutRequestID was logged in the audit
				// Look up the original STK Push audit log to find the invoice number
				try {
					const invoiceNumber = await this.findInvoiceNumberFromStkAudit(CheckoutRequestID);

					if (invoiceNumber) {
						// Find the invoice by invoice number
						const invoice = await this.findInvoiceByNumber(invoiceNumber);

						if (invoice) {
							// Record the payment
							await this.invoicesService.recordPayment(
								invoice.invoiceId,
								{
									amount,
									currency: 'KES',
									method: PaymentMethod.MPESA_STK_PUSH,
									externalReference: mpesaReceiptNumber,
									payerName: phoneNumber?.toString(),
									paymentDate: this.parseMpesaDate(transactionDate),
									notes: `M-Pesa STK Push payment. Receipt: ${mpesaReceiptNumber}. Phone: ${phoneNumber}`,
								},
								'system',
							);

							// Audit log — success
							await this.auditService.createLog({
								action: AuditAction.STK_PUSH_CALLBACK_SUCCESS,
								performedBy: 'system',
								targetType: AuditTargetType.PAYMENT,
								targetId: mpesaReceiptNumber,
								details: `STK Push payment confirmed: KES ${amount} for invoice ${invoiceNumber}`,
								metadata: {
									mpesaReceiptNumber,
									amount,
									phoneNumber: phoneNumber?.toString(),
									transactionDate: transactionDate?.toString(),
									invoiceNumber,
									checkoutRequestId: CheckoutRequestID,
									merchantRequestId: MerchantRequestID,
								},
							});

							this.logger.log(
								`STK Push payment recorded for invoice ${invoiceNumber}: KES ${amount}`,
							);
						} else {
							this.logger.warn(
								`STK Push callback: Invoice not found for number ${invoiceNumber}`,
							);
						}
					} else {
						this.logger.warn(
							`STK Push callback: Could not find invoice number for CheckoutRequestID=${CheckoutRequestID}`,
						);
					}
				} catch (paymentError) {
					this.logger.error(
						`Error recording STK Push payment: ${paymentError.message}`,
						paymentError.stack,
					);
				}
			} else {
				// Payment failed
				await this.auditService.createLog({
					action: AuditAction.STK_PUSH_CALLBACK_FAILED,
					performedBy: 'system',
					targetType: AuditTargetType.PAYMENT,
					targetId: CheckoutRequestID,
					details: `STK Push failed: ${ResultDesc}`,
					metadata: {
						resultCode: ResultCode,
						resultDesc: ResultDesc,
						checkoutRequestId: CheckoutRequestID,
						merchantRequestId: MerchantRequestID,
					},
				});

				this.logger.warn(
					`STK Push failed: CheckoutRequestID=${CheckoutRequestID}, Reason=${ResultDesc}`,
				);
			}
		} catch (error) {
			this.logger.error('Error processing STK callback', error);
		}

		// Always acknowledge the callback to Safaricom
		return { ResultCode: 0, ResultDesc: 'Accepted' };
	}

	/**
	 * Handles C2B confirmation callback from Safaricom.
	 * Attempts to match the payment to an invoice using the BillRefNumber.
	 *
	 * @param data - The C2B confirmation data from Safaricom
	 * @returns Acknowledgement response for Safaricom
	 */
	async handleC2BConfirmation(
		data: MpesaC2BConfirmationData,
	): Promise<{ ResultCode: number; ResultDesc: string }> {
		try {
			const {
				TransID,
				TransAmount,
				BillRefNumber,
				MSISDN,
				FirstName,
				MiddleName,
				LastName,
			} = data;

			const amount = parseFloat(TransAmount);
			const payerName = [FirstName, MiddleName, LastName].filter(Boolean).join(' ').trim();
			const accountReference = BillRefNumber?.trim().toUpperCase();

			this.logger.log(
				`C2B Confirmation received: TransID=${TransID}, Amount=${amount}, BillRef=${accountReference}, Phone=${MSISDN}`,
			);

			// Try to find invoice by BillRefNumber (account reference matches invoice number)
			const invoice = await this.findInvoiceByNumber(accountReference);

			if (invoice) {
				// Record the payment
				await this.invoicesService.recordPayment(
					invoice.invoiceId,
					{
						amount,
						currency: 'KES',
						method: PaymentMethod.MPESA_PAYBILL,
						externalReference: TransID,
						payerName: payerName || MSISDN,
						paymentDate: new Date(),
						notes: `M-Pesa Paybill payment. Transaction: ${TransID}. Phone: ${MSISDN}. Payer: ${payerName}`,
					},
					'system',
				);

				// Audit log — matched
				await this.auditService.createLog({
					action: AuditAction.C2B_PAYMENT_RECEIVED,
					performedBy: 'system',
					targetType: AuditTargetType.PAYMENT,
					targetId: TransID,
					details: `C2B payment matched to invoice ${invoice.invoiceNumber}: KES ${amount} from ${payerName || MSISDN}`,
					metadata: {
						transactionId: TransID,
						amount,
						billRefNumber: accountReference,
						invoiceId: invoice.invoiceId,
						invoiceNumber: invoice.invoiceNumber,
						msisdn: MSISDN,
						payerName,
					},
				});

				this.logger.log(
					`C2B payment recorded for invoice ${invoice.invoiceNumber}: KES ${amount}`,
				);
			} else {
				// Invoice not found — log for manual reconciliation
				await this.auditService.createLog({
					action: AuditAction.C2B_PAYMENT_UNMATCHED,
					performedBy: 'system',
					targetType: AuditTargetType.PAYMENT,
					targetId: TransID,
					details: `C2B payment could not be matched to any invoice. BillRefNumber: ${accountReference}, Amount: KES ${amount}`,
					metadata: {
						transactionId: TransID,
						transactionType: data.TransactionType,
						transTime: data.TransTime,
						amount,
						businessShortCode: data.BusinessShortCode,
						billRefNumber: accountReference,
						invoiceNumber: data.InvoiceNumber,
						orgAccountBalance: data.OrgAccountBalance,
						thirdPartyTransId: data.ThirdPartyTransID,
						msisdn: MSISDN,
						firstName: FirstName,
						middleName: MiddleName,
						lastName: LastName,
					},
				});

				this.logger.warn(
					`C2B payment unmatched: TransID=${TransID}, BillRef=${accountReference}, Amount=${amount}`,
				);
			}
		} catch (error) {
			this.logger.error('Error processing C2B confirmation', error);
		}

		// Always acknowledge the callback to Safaricom
		return { ResultCode: 0, ResultDesc: 'Accepted' };
	}

	/**
	 * Registers C2B confirmation and validation URLs with Safaricom.
	 * This must be called once to set up Paybill callbacks.
	 *
	 * @param confirmationUrl - URL for C2B payment confirmations
	 * @param validationUrl - URL for C2B payment validations
	 * @returns Daraja registration response
	 */
	async registerC2BUrls(
		confirmationUrl?: string,
		validationUrl?: string,
	): Promise<MpesaC2BRegisterResponse> {
		const accessToken = await this.getAccessToken();
		const baseUrl = this.getBaseUrl();
		const shortCode = this.configService.get<string>('MPESA_PAYBILL_NUMBER');
		const backendUrl = this.configService.get<string>('BACKEND_URL', '');

		if (!shortCode) {
			throw new InternalServerErrorException('M-Pesa paybill number is not configured');
		}

		const defaultConfirmationUrl =
			confirmationUrl || `${backendUrl}/mpesa/callback/c2b/confirmation`;
		const defaultValidationUrl =
			validationUrl || `${backendUrl}/mpesa/callback/c2b/validation`;

		const requestBody = {
			ShortCode: shortCode,
			ResponseType: 'Completed',
			ConfirmationURL: defaultConfirmationUrl,
			ValidationURL: defaultValidationUrl,
		};

		try {
			const response = await fetch(`${baseUrl}/mpesa/c2b/v1/registerurl`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
				},
				body: JSON.stringify(requestBody),
			});

			const responseData = (await response.json()) as MpesaC2BRegisterResponse;

			if (!response.ok) {
				this.logger.error(
					`C2B URL registration failed: ${JSON.stringify(responseData)}`,
				);
				throw new InternalServerErrorException(
					'Failed to register C2B URLs with Safaricom',
				);
			}

			// Audit log
			await this.auditService.createLog({
				action: AuditAction.C2B_URLS_REGISTERED,
				performedBy: 'system',
				targetType: AuditTargetType.PAYMENT,
				details: 'C2B confirmation and validation URLs registered with Safaricom',
				metadata: {
					shortCode,
					confirmationUrl: defaultConfirmationUrl,
					validationUrl: defaultValidationUrl,
					response: responseData,
				},
			});

			this.logger.log('C2B URLs registered successfully with Safaricom');

			return responseData;
		} catch (error) {
			if (error instanceof InternalServerErrorException) {
				throw error;
			}
			this.logger.error('Error registering C2B URLs', error);
			throw new InternalServerErrorException('Failed to register C2B URLs with Safaricom');
		}
	}

	/**
	 * Attempts to find the invoice number from the audit log of the original STK Push initiation.
	 * This is used during callback processing to match the payment to an invoice.
	 */
	private async findInvoiceNumberFromStkAudit(
		checkoutRequestId: string,
	): Promise<string | null> {
		try {
			// Look up the audit log entry for the STK Push initiation
			// The CheckoutRequestID was stored as the targetId in the audit log
			const auditLog = await this.auditService.getLogById(checkoutRequestId);

			if (auditLog?.metadata && typeof auditLog.metadata === 'object') {
				return (auditLog.metadata as Record<string, any>).invoiceNumber || null;
			}

			return null;
		} catch {
			return null;
		}
	}

	/**
	 * Finds an invoice by its invoice number (e.g., ISP-2025-0001).
	 * The invoice number is used as the M-Pesa account reference.
	 */
	private async findInvoiceByNumber(invoiceNumber: string): Promise<any | null> {
		if (!invoiceNumber) {
			return null;
		}

		try {
			// Use InvoicesService to search — we look through findAll with a search filter
			const result = await this.invoicesService.findAll({
				search: invoiceNumber,
				page: 1,
				limit: 1,
			});

			if (result.data && result.data.length > 0) {
				// Verify exact match (search might return partial matches)
				const matched = result.data.find(
					(inv) => inv.invoiceNumber.toUpperCase() === invoiceNumber.toUpperCase(),
				);
				return matched || null;
			}

			return null;
		} catch (error) {
			this.logger.error(
				`Error finding invoice by number ${invoiceNumber}: ${error.message}`,
			);
			return null;
		}
	}

	/**
	 * Parses an M-Pesa transaction date (format YYYYMMDDHHMMSS or numeric) into a Date object.
	 */
	private parseMpesaDate(transactionDate: string | number | undefined): Date {
		if (!transactionDate) {
			return new Date();
		}

		const dateStr = transactionDate.toString();

		if (dateStr.length === 14) {
			// Format: YYYYMMDDHHMMSS
			const year = parseInt(dateStr.substring(0, 4), 10);
			const month = parseInt(dateStr.substring(4, 6), 10) - 1;
			const day = parseInt(dateStr.substring(6, 8), 10);
			const hours = parseInt(dateStr.substring(8, 10), 10);
			const minutes = parseInt(dateStr.substring(10, 12), 10);
			const seconds = parseInt(dateStr.substring(12, 14), 10);

			return new Date(year, month, day, hours, minutes, seconds);
		}

		// Try parsing as a number (timestamp)
		const numericDate = Number(dateStr);
		if (!isNaN(numericDate)) {
			return new Date(numericDate);
		}

		return new Date();
	}
}
