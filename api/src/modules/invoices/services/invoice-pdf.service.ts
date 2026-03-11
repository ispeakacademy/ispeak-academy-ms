import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument, rgb, StandardFonts, PDFFont, PDFPage, degrees } from 'pdf-lib';
import { Invoice } from '../entities/invoice.entity';
import { SystemSetting } from '@/modules/settings/entities/system-setting.entity';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
	const clean = hex.replace('#', '');
	return {
		r: parseInt(clean.substring(0, 2), 16) / 255,
		g: parseInt(clean.substring(2, 4), 16) / 255,
		b: parseInt(clean.substring(4, 6), 16) / 255,
	};
}

function formatCurrency(amount: number | string, currency: string): string {
	return `${currency} ${Number(amount).toLocaleString('en-KE', {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	})}`;
}

function formatDate(date: Date | string): string {
	return new Date(date).toLocaleDateString('en-KE', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});
}

@Injectable()
export class InvoicePdfService {
	private readonly logger = new Logger(InvoicePdfService.name);

	async generatePdf(invoice: Invoice, settings: SystemSetting | null): Promise<Buffer> {
		const primaryColor = hexToRgb(settings?.primaryColor || '#000000');
		const secondaryColor = hexToRgb(settings?.secondaryColor || '#D4A843');
		const platformName = settings?.platformName || 'iSpeak Academy';
		const contactPhone = settings?.contactPhone || '';
		const contactAddress = settings?.contactAddress || '';
		const supportEmail = settings?.supportEmail || '';
		const logoUrl = settings?.invoiceLogo || settings?.appLogo || '';

		const pdfDoc = await PDFDocument.create();
		const page = pdfDoc.addPage([595, 842]); // A4
		const { width, height } = page.getSize();
		const margin = 56; // ~20mm
		const contentWidth = width - margin * 2;

		const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
		const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
		const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

		let y = height;

		// ══════════════════════════════════════════════
		// STATUS WATERMARK (drawn first, behind all content)
		// ══════════════════════════════════════════════
		const status = invoice.status?.toLowerCase();
		let watermarkText = '';
		let wmColor = { r: 0, g: 0, b: 0 };
		let wmOpacity = 0;

		if (status === 'paid') {
			watermarkText = 'PAID';
			wmColor = { r: 0, g: 0.63, b: 0 };
			wmOpacity = 0.06;
		} else if (status === 'void') {
			watermarkText = 'VOID';
			wmColor = { r: 0.78, g: 0, b: 0 };
			wmOpacity = 0.08;
		} else if (status === 'overdue') {
			watermarkText = 'OVERDUE';
			wmColor = { r: 0.78, g: 0, b: 0 };
			wmOpacity = 0.06;
		}

		if (watermarkText) {
			const wmFontSize = 72;
			const wmWidth = fontBold.widthOfTextAtSize(watermarkText, wmFontSize);
			page.drawText(watermarkText, {
				x: (width - wmWidth * 0.7) / 2,
				y: height / 2,
				size: wmFontSize,
				font: fontBold,
				color: rgb(wmColor.r, wmColor.g, wmColor.b),
				opacity: wmOpacity,
				rotate: degrees(45),
			});
		}

		// ══════════════════════════════════════════════
		// HEADER — primary color background (142pt ≈ 50mm)
		// ══════════════════════════════════════════════
		const headerHeight = 142;
		page.drawRectangle({
			x: 0,
			y: height - headerHeight,
			width,
			height: headerHeight,
			color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
		});

		// Accent line at bottom of header
		page.drawRectangle({
			x: 0,
			y: height - headerHeight - 4,
			width,
			height: 4,
			color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
		});

		// Logo or Platform Name (left side)
		let logoRendered = false;
		if (logoUrl) {
			try {
				const response = await fetch(logoUrl);
				const arrayBuffer = await response.arrayBuffer();
				const logoBytes = new Uint8Array(arrayBuffer);
				const contentType = response.headers.get('content-type') || '';

				let logoImage;
				if (contentType.includes('png') || logoUrl.toLowerCase().endsWith('.png')) {
					logoImage = await pdfDoc.embedPng(logoBytes);
				} else {
					logoImage = await pdfDoc.embedJpg(logoBytes);
				}

				// Scale proportionally — max 108x68pt (≈38x24mm)
				const maxW = 108;
				const maxH = 68;
				const scale = Math.min(maxW / logoImage.width, maxH / logoImage.height);
				const logoW = logoImage.width * scale;
				const logoH = logoImage.height * scale;

				page.drawImage(logoImage, {
					x: margin,
					y: height - 37 - logoH / 2,
					width: logoW,
					height: logoH,
				});
				logoRendered = true;
			} catch (err) {
				this.logger.warn(`Failed to load invoice logo: ${err}`);
			}
		}
		if (!logoRendered) {
			page.drawText(platformName, {
				x: margin,
				y: height - 50,
				size: 20,
				font: fontBold,
				color: rgb(1, 1, 1),
			});
		}

		// "INVOICE" title (right side)
		const invoiceTitle = 'INVOICE';
		const titleWidth = fontBold.widthOfTextAtSize(invoiceTitle, 26);
		page.drawText(invoiceTitle, {
			x: width - margin - titleWidth,
			y: height - 42,
			size: 26,
			font: fontBold,
			color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
		});

		// Invoice number
		const invNumWidth = fontRegular.widthOfTextAtSize(invoice.invoiceNumber, 10);
		page.drawText(invoice.invoiceNumber, {
			x: width - margin - invNumWidth,
			y: height - 58,
			size: 10,
			font: fontRegular,
			color: rgb(1, 1, 1),
		});

		y = height - headerHeight - 20;

		// ══════════════════════════════════════════════
		// FROM (left) + INVOICE DETAILS (right)
		// ══════════════════════════════════════════════

		// Section label: FROM
		this.drawSectionLabel(page, 'FROM', margin, y, fontBold, secondaryColor);
		y -= 16;

		// Company name
		page.drawText(platformName, {
			x: margin,
			y,
			size: 11,
			font: fontBold,
			color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
		});
		y -= 14;

		const companyDetailLines: string[] = [];
		if (contactAddress) companyDetailLines.push(contactAddress);
		if (contactPhone) companyDetailLines.push(`Tel: ${contactPhone}`);
		if (supportEmail) companyDetailLines.push(`Email: ${supportEmail}`);

		companyDetailLines.forEach((line) => {
			page.drawText(line, {
				x: margin,
				y,
				size: 9,
				font: fontRegular,
				color: rgb(0.31, 0.31, 0.31),
			});
			y -= 13;
		});

		// Invoice details — right column
		const detailsStartY = height - headerHeight - 20;
		const detailsRightX = width - margin;

		// Section label: INVOICE DETAILS
		this.drawSectionLabel(page, 'INVOICE DETAILS', detailsRightX - 155, detailsStartY, fontBold, secondaryColor);

		const detailItems = [
			['Issue Date:', formatDate(invoice.issueDate)],
			['Due Date:', formatDate(invoice.dueDate)],
			['Status:', invoice.status.toUpperCase()],
			['Currency:', invoice.currency],
		];

		detailItems.forEach(([label, value], i) => {
			const rowY = detailsStartY - 16 - i * 15;
			page.drawText(label, {
				x: detailsRightX - 155,
				y: rowY,
				size: 9,
				font: fontRegular,
				color: rgb(0.47, 0.47, 0.47),
			});
			const valueWidth = fontBold.widthOfTextAtSize(value, 9);
			page.drawText(value, {
				x: detailsRightX - valueWidth,
				y: rowY,
				size: 9,
				font: fontBold,
				color: rgb(0.2, 0.2, 0.2),
			});
		});

		y = Math.min(y, detailsStartY - 16 - detailItems.length * 15) - 8;

		// ── Divider ──
		page.drawLine({
			start: { x: margin, y },
			end: { x: width - margin, y },
			thickness: 1,
			color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
		});
		y -= 20;

		// ══════════════════════════════════════════════
		// BILL TO
		// ══════════════════════════════════════════════
		this.drawSectionLabel(page, 'BILL TO', margin, y, fontBold, secondaryColor);
		y -= 16;

		if (invoice.client) {
			page.drawText(`${invoice.client.firstName} ${invoice.client.lastName}`, {
				x: margin,
				y,
				size: 11,
				font: fontBold,
				color: rgb(0.16, 0.16, 0.16),
			});
			y -= 14;
			if (invoice.client.email) {
				page.drawText(invoice.client.email, {
					x: margin,
					y,
					size: 9,
					font: fontRegular,
					color: rgb(0.31, 0.31, 0.31),
				});
				y -= 13;
			}
			if (invoice.client.phone) {
				page.drawText(invoice.client.phone, {
					x: margin,
					y,
					size: 9,
					font: fontRegular,
					color: rgb(0.31, 0.31, 0.31),
				});
				y -= 13;
			}
		}

		y -= 10;

		// ══════════════════════════════════════════════
		// LINE ITEMS TABLE
		// ══════════════════════════════════════════════
		const lineItems = invoice.lineItems || [];
		const colWidths = [30, contentWidth - 30 - 40 - 80 - 90, 40, 80, 90];
		const headers = ['#', 'Description', 'Qty', 'Unit Price', 'Total'];

		// Table header
		const headerRowHeight = 26;
		page.drawRectangle({
			x: margin,
			y: y - headerRowHeight,
			width: contentWidth,
			height: headerRowHeight,
			color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
		});

		let colX = margin;
		headers.forEach((header, i) => {
			const textX = i >= 2 ? colX + colWidths[i] - fontBold.widthOfTextAtSize(header, 9) - 6 : colX + 6;
			page.drawText(header, {
				x: textX,
				y: y - 17,
				size: 9,
				font: fontBold,
				color: rgb(1, 1, 1),
			});
			colX += colWidths[i];
		});

		y -= headerRowHeight;

		// Table rows
		lineItems.forEach((item, idx) => {
			const rowHeight = 24;

			// Alternating row background
			if (idx % 2 === 0) {
				page.drawRectangle({
					x: margin,
					y: y - rowHeight,
					width: contentWidth,
					height: rowHeight,
					color: rgb(0.96, 0.97, 0.98),
				});
			}

			const rowValues = [
				(idx + 1).toString(),
				item.description,
				item.quantity.toString(),
				formatCurrency(item.unitPrice, invoice.currency),
				formatCurrency(item.total, invoice.currency),
			];

			colX = margin;
			rowValues.forEach((val, i) => {
				let displayVal = val;
				if (i === 1) {
					const maxDescWidth = colWidths[i] - 12;
					while (fontRegular.widthOfTextAtSize(displayVal, 9) > maxDescWidth && displayVal.length > 3) {
						displayVal = displayVal.slice(0, -4) + '...';
					}
				}

				const textX = i >= 2
					? colX + colWidths[i] - fontRegular.widthOfTextAtSize(displayVal, 9) - 6
					: colX + 6;
				page.drawText(displayVal, {
					x: textX,
					y: y - 16,
					size: 9,
					font: fontRegular,
					color: rgb(0.2, 0.2, 0.2),
				});
				colX += colWidths[i];
			});

			y -= rowHeight;
		});

		y -= 16;

		// ══════════════════════════════════════════════
		// TOTALS SECTION
		// ══════════════════════════════════════════════
		const totalsX = width - margin - 200;
		const totalsValueX = width - margin;

		const drawTotalRow = (label: string, value: string, bold = false, color = { r: 0.31, g: 0.31, b: 0.31 }) => {
			const font = bold ? fontBold : fontRegular;
			const fontSize = bold ? 11 : 9;
			page.drawText(label, {
				x: totalsX,
				y,
				size: fontSize,
				font,
				color: rgb(color.r, color.g, color.b),
			});
			const valueW = font.widthOfTextAtSize(value, fontSize);
			page.drawText(value, {
				x: totalsValueX - valueW,
				y,
				size: fontSize,
				font,
				color: rgb(color.r, color.g, color.b),
			});
			y -= bold ? 18 : 14;
		};

		drawTotalRow('Subtotal', formatCurrency(invoice.subtotal, invoice.currency));

		if (Number(invoice.discountPercent) > 0) {
			drawTotalRow(
				`Discount (${invoice.discountPercent}%)`,
				`- ${formatCurrency(invoice.discountAmount, invoice.currency)}`,
				false,
				{ r: 0, g: 0.5, b: 0 },
			);
		}

		if (Number(invoice.taxPercent) > 0) {
			drawTotalRow(
				`VAT (${invoice.taxPercent}%)`,
				formatCurrency(invoice.taxAmount, invoice.currency),
			);
		}

		// Total divider
		page.drawLine({
			start: { x: totalsX, y: y + 6 },
			end: { x: totalsValueX, y: y + 6 },
			thickness: 0.5,
			color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
		});

		drawTotalRow(
			'Total',
			formatCurrency(invoice.totalAmount, invoice.currency),
			true,
			primaryColor,
		);

		if (Number(invoice.amountPaid) > 0) {
			drawTotalRow(
				'Amount Paid',
				formatCurrency(invoice.amountPaid, invoice.currency),
				false,
				{ r: 0, g: 0.5, b: 0 },
			);
		}

		const balance = Number(invoice.balance);
		if (balance > 0) {
			// Balance due highlight box
			const boxW = totalsValueX - totalsX + 14;
			page.drawRectangle({
				x: totalsX - 7,
				y: y - 6,
				width: boxW,
				height: 22,
				color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
			});

			const balLabel = 'Balance Due';
			const balValue = formatCurrency(balance, invoice.currency);
			page.drawText(balLabel, {
				x: totalsX,
				y: y + 2,
				size: 11,
				font: fontBold,
				color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
			});
			const balValueW = fontBold.widthOfTextAtSize(balValue, 11);
			page.drawText(balValue, {
				x: totalsValueX - balValueW,
				y: y + 2,
				size: 11,
				font: fontBold,
				color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
			});
			y -= 34;
		} else {
			// Paid in full box
			const boxW = totalsValueX - totalsX + 14;
			page.drawRectangle({
				x: totalsX - 7,
				y: y - 6,
				width: boxW,
				height: 22,
				color: rgb(0, 0.55, 0),
			});
			const paidText = 'PAID IN FULL';
			const paidW = fontBold.widthOfTextAtSize(paidText, 11);
			page.drawText(paidText, {
				x: totalsX + (totalsValueX - totalsX - paidW) / 2,
				y: y + 2,
				size: 11,
				font: fontBold,
				color: rgb(1, 1, 1),
			});
			y -= 34;
		}

		// ══════════════════════════════════════════════
		// PAYMENT INSTRUCTIONS (only when balance > 0)
		// ══════════════════════════════════════════════
		if (balance > 0 && (invoice as any).paymentInstructions) {
			const instructions = (invoice as any).paymentInstructions;
			const mpesa = instructions?.mpesa;
			const bank = instructions?.bankTransfer;
			const hasMpesa = mpesa?.paybillNumber;
			const hasBank = bank?.bankName && bank?.accountNumber;

			if (hasMpesa || hasBank) {
				const instrLines: string[] = [];
				if (hasMpesa) {
					instrLines.push(`M-Pesa:  Paybill ${mpesa.paybillNumber}  |  Account: ${mpesa.accountNumber || invoice.invoiceNumber}`);
				}
				if (hasBank) {
					let bankLine = `Bank Transfer:  ${bank.bankName}  |  Acc: ${bank.accountNumber}`;
					if (bank.accountName) bankLine += `  |  Name: ${bank.accountName}`;
					if (bank.swiftCode) bankLine += `  |  Swift: ${bank.swiftCode}`;
					instrLines.push(bankLine);
				}

				const boxHeight = 14 + instrLines.length * 14;
				page.drawRectangle({
					x: margin,
					y: y - boxHeight + 6,
					width: contentWidth,
					height: boxHeight,
					color: rgb(0.96, 0.97, 0.98),
				});

				// Label
				page.drawText('PAYMENT INSTRUCTIONS', {
					x: margin + 10,
					y: y - 2,
					size: 8,
					font: fontBold,
					color: rgb(primaryColor.r, primaryColor.g, primaryColor.b),
				});
				y -= 16;

				// Detail lines
				instrLines.forEach((line) => {
					page.drawText(line, {
						x: margin + 10,
						y,
						size: 8.5,
						font: fontRegular,
						color: rgb(0.24, 0.24, 0.24),
					});
					y -= 14;
				});

				y -= 6;
			}
		}

		// ══════════════════════════════════════════════
		// NOTES
		// ══════════════════════════════════════════════
		if (invoice.notes) {
			this.drawSectionLabel(page, 'NOTES', margin, y, fontBold, secondaryColor);
			y -= 16;

			// Simple word wrap
			const words = invoice.notes.split(' ');
			let line = '';
			const noteLines: string[] = [];
			for (const word of words) {
				const test = line ? `${line} ${word}` : word;
				if (fontRegular.widthOfTextAtSize(test, 9) > contentWidth) {
					noteLines.push(line);
					line = word;
				} else {
					line = test;
				}
			}
			if (line) noteLines.push(line);

			noteLines.forEach((noteLine) => {
				page.drawText(noteLine, {
					x: margin,
					y,
					size: 9,
					font: fontRegular,
					color: rgb(0.31, 0.31, 0.31),
				});
				y -= 12;
			});
		}

		// ══════════════════════════════════════════════
		// FOOTER
		// ══════════════════════════════════════════════
		const footerY = 40;
		page.drawLine({
			start: { x: margin, y: footerY + 14 },
			end: { x: width - margin, y: footerY + 14 },
			thickness: 0.5,
			color: rgb(secondaryColor.r, secondaryColor.g, secondaryColor.b),
		});

		const thankYou = 'Thank you for your business!';
		const thankYouW = fontItalic.widthOfTextAtSize(thankYou, 8);
		page.drawText(thankYou, {
			x: (width - thankYouW) / 2,
			y: footerY + 2,
			size: 8,
			font: fontItalic,
			color: rgb(0.59, 0.59, 0.59),
		});

		const footerInfo = `${platformName}  |  ${supportEmail}  |  ${contactPhone}`;
		const footerInfoW = fontRegular.widthOfTextAtSize(footerInfo, 8);
		page.drawText(footerInfo, {
			x: (width - footerInfoW) / 2,
			y: footerY - 10,
			size: 8,
			font: fontRegular,
			color: rgb(0.59, 0.59, 0.59),
		});

		// Serialize
		const pdfBytes = await pdfDoc.save();
		return Buffer.from(pdfBytes);
	}

	private drawSectionLabel(
		page: PDFPage,
		text: string,
		x: number,
		y: number,
		font: PDFFont,
		color: { r: number; g: number; b: number },
	) {
		page.drawText(text, {
			x,
			y,
			size: 8,
			font,
			color: rgb(color.r, color.g, color.b),
		});
		const textWidth = font.widthOfTextAtSize(text, 8);
		page.drawLine({
			start: { x, y: y - 3 },
			end: { x: x + textWidth, y: y - 3 },
			thickness: 0.8,
			color: rgb(color.r, color.g, color.b),
		});
	}
}
