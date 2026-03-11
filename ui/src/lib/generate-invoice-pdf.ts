import type { Invoice } from '@/types/invoices';
import type { SystemSetting } from '@/types/settings';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16);
  const g = parseInt(clean.substring(2, 4), 16);
  const b = parseInt(clean.substring(4, 6), 16);
  return [r, g, b];
}

function formatCurrency(amount: number | string, currency: string): string {
  return `${currency} ${Number(amount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-KE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function loadImage(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas context not available'));
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = url;
  });
}

export async function generateInvoicePDF(invoice: Invoice, settings: SystemSetting | null) {
  const primaryColor = settings?.primaryColor || '#000000';
  const secondaryColor = settings?.secondaryColor || '#D4A843';
  const platformName = settings?.platformName || 'iSpeak Academy';
  const contactPhone = settings?.contactPhone || '';
  const contactAddress = settings?.contactAddress || '';
  const supportEmail = settings?.supportEmail || '';
  const logoUrl = settings?.invoiceLogo || settings?.appLogo || '';

  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  // ══════════════════════════════════════════════
  // HEADER — 50mm tall, primary color background
  // ══════════════════════════════════════════════
  const headerHeight = 50;
  doc.setFillColor(...primaryRgb);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Accent line at bottom of header
  doc.setFillColor(...secondaryRgb);
  doc.rect(0, headerHeight, pageWidth, 1.5, 'F');

  // Logo or Platform Name (left side)
  let logoLoaded = false;
  if (logoUrl) {
    try {
      const img = await loadImage(logoUrl);
      // Scale logo proportionally — max 38x24mm
      doc.addImage(img, 'PNG', margin, 13, 38, 24);
      logoLoaded = true;
    } catch {
      // fallback below
    }
  }
  if (!logoLoaded) {
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(platformName, margin, 30);
  }

  // "INVOICE" title (right side)
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', pageWidth - margin, 25, { align: 'right' });

  // Invoice number below title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceNumber, pageWidth - margin, 34, { align: 'right' });

  y = headerHeight + 12;

  // ══════════════════════════════════════════════
  // FROM (left) + INVOICE DETAILS (right)
  // ══════════════════════════════════════════════

  // Section label: FROM
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', margin, y);
  // Small accent underline
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 1.5, margin + 14, y + 1.5);
  y += 6;

  // Company info
  doc.setTextColor(...primaryRgb);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(platformName, margin, y);
  y += 5;

  doc.setTextColor(80, 80, 80);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  if (contactAddress) {
    doc.text(contactAddress, margin, y);
    y += 4.5;
  }
  if (contactPhone) {
    doc.text(`Tel: ${contactPhone}`, margin, y);
    y += 4.5;
  }
  if (supportEmail) {
    doc.text(`Email: ${supportEmail}`, margin, y);
    y += 4.5;
  }

  // Invoice details — right column
  const detailsStartY = headerHeight + 18;
  const detailsX = pageWidth - margin;

  // Section label: INVOICE DETAILS
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE DETAILS', detailsX - 55, detailsStartY - 6);
  doc.setDrawColor(...secondaryRgb);
  doc.line(detailsX - 55, detailsStartY - 4.5, detailsX - 14, detailsStartY - 4.5);

  const detailItems: [string, string][] = [
    ['Issue Date:', formatDate(invoice.issueDate)],
    ['Due Date:', formatDate(invoice.dueDate)],
    ['Status:', invoice.status.toUpperCase()],
    ['Currency:', invoice.currency],
  ];
  if (invoice.purchaseOrderNumber) {
    detailItems.push(['PO Number:', invoice.purchaseOrderNumber]);
  }

  detailItems.forEach(([label, value], i) => {
    const rowY = detailsStartY + i * 5.5;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120, 120, 120);
    doc.setFontSize(9);
    doc.text(label, detailsX - 55, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text(value, detailsX, rowY, { align: 'right' });
  });

  y = Math.max(y, detailsStartY + detailItems.length * 5.5) + 8;

  // ── Divider ──
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.8);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // ══════════════════════════════════════════════
  // BILL TO
  // ══════════════════════════════════════════════
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO', margin, y);
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 1.5, margin + 17, y + 1.5);
  y += 6;

  if (invoice.client) {
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`${invoice.client.firstName} ${invoice.client.lastName}`, margin, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    if (invoice.client.email) {
      doc.text(invoice.client.email, margin, y);
      y += 4.5;
    }
    if (invoice.client.phone) {
      doc.text(invoice.client.phone, margin, y);
      y += 4.5;
    }
  } else {
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text('—', margin, y);
    y += 5;
  }

  y += 8;

  // ══════════════════════════════════════════════
  // LINE ITEMS TABLE
  // ══════════════════════════════════════════════
  const lineItems = invoice.lineItems || [];
  const tableBody = lineItems.map((item, idx) => [
    (idx + 1).toString(),
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, invoice.currency),
    formatCurrency(item.total, invoice.currency),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: tableBody,
    theme: 'plain',
    margin: { left: margin, right: margin },
    headStyles: {
      fillColor: primaryRgb,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
    },
    bodyStyles: {
      textColor: [50, 50, 50],
      fontSize: 9,
      cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 38, halign: 'right' },
      4: { cellWidth: 42, halign: 'right' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  // ══════════════════════════════════════════════
  // TOTALS SECTION
  // ══════════════════════════════════════════════
  const totalsX = pageWidth - margin - 85;
  const totalsValueX = pageWidth - margin;

  const drawTotalRow = (label: string, value: string, bold = false, color?: [number, number, number]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(color ? color[0] : 80, color ? color[1] : 80, color ? color[2] : 80);
    doc.setFontSize(bold ? 11 : 9);
    doc.text(label, totalsX, y);
    doc.text(value, totalsValueX, y, { align: 'right' });
    y += bold ? 7 : 5.5;
  };

  drawTotalRow('Subtotal', formatCurrency(invoice.subtotal, invoice.currency));

  if (Number(invoice.discountPercent) > 0) {
    drawTotalRow(
      `Discount (${invoice.discountPercent}%)`,
      `- ${formatCurrency(invoice.discountAmount, invoice.currency)}`,
      false,
      [0, 128, 0],
    );
  }

  if (Number(invoice.taxPercent) > 0) {
    drawTotalRow(
      `VAT (${invoice.taxPercent}%)`,
      formatCurrency(invoice.taxAmount, invoice.currency),
    );
  }

  // Total divider
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, totalsValueX, y);
  y += 5;

  drawTotalRow('Total', formatCurrency(invoice.totalAmount, invoice.currency), true, primaryRgb);

  if (Number(invoice.amountPaid) > 0) {
    drawTotalRow('Amount Paid', formatCurrency(invoice.amountPaid, invoice.currency), false, [0, 128, 0]);
  }

  const balance = Number(invoice.balance);
  if (balance > 0) {
    // Divider before balance
    doc.setDrawColor(...secondaryRgb);
    doc.setLineWidth(0.5);
    doc.line(totalsX, y, totalsValueX, y);
    y += 5;

    // Balance due highlight box
    const boxWidth = totalsValueX - totalsX + 10;
    doc.setFillColor(...secondaryRgb);
    doc.roundedRect(totalsX - 5, y - 4, boxWidth, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryRgb);
    doc.setFontSize(11);
    doc.text('Balance Due', totalsX, y + 3);
    doc.text(formatCurrency(balance, invoice.currency), totalsValueX, y + 3, { align: 'right' });
    y += 16;
  } else {
    y += 3;
    // Paid in full box
    const boxWidth = totalsValueX - totalsX + 10;
    doc.setFillColor(0, 140, 0);
    doc.roundedRect(totalsX - 5, y - 4, boxWidth, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('PAID IN FULL', (totalsX + totalsValueX) / 2, y + 3, { align: 'center' });
    y += 16;
  }

  // ══════════════════════════════════════════════
  // PAYMENT INSTRUCTIONS (only when balance > 0)
  // ══════════════════════════════════════════════
  if (balance > 0) {
    const mpesa = invoice.paymentInstructions?.mpesa;
    const bank = invoice.paymentInstructions?.bankTransfer;
    const hasMpesa = mpesa?.paybillNumber;
    const hasBank = bank?.bankName && bank?.accountNumber;

    if (hasMpesa || hasBank) {
      // Light background box
      const instrStartY = y;
      const instrLines: string[] = [];

      if (hasMpesa) {
        instrLines.push(`M-Pesa:  Paybill ${mpesa!.paybillNumber}  |  Account: ${mpesa!.accountNumber || invoice.invoiceNumber}`);
      }
      if (hasBank) {
        let bankLine = `Bank Transfer:  ${bank!.bankName}  |  Acc: ${bank!.accountNumber}`;
        if (bank!.accountName) bankLine += `  |  Name: ${bank!.accountName}`;
        if (bank!.swiftCode) bankLine += `  |  Swift: ${bank!.swiftCode}`;
        instrLines.push(bankLine);
      }

      const boxHeight = 10 + instrLines.length * 5.5;
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margin, y - 2, contentWidth, boxHeight, 2, 2, 'F');

      // Section label
      doc.setTextColor(...primaryRgb);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYMENT INSTRUCTIONS', margin + 5, y + 4);
      y += 8;

      // Payment detail lines
      doc.setTextColor(60, 60, 60);
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      instrLines.forEach((line) => {
        doc.text(line, margin + 5, y);
        y += 5.5;
      });

      y += 5;
    }
  }

  // ══════════════════════════════════════════════
  // NOTES
  // ══════════════════════════════════════════════
  if (invoice.notes) {
    doc.setTextColor(...secondaryRgb);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES', margin, y);
    doc.setDrawColor(...secondaryRgb);
    doc.setLineWidth(0.6);
    doc.line(margin, y + 1.5, margin + 15, y + 1.5);
    y += 6;
    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const noteLines = doc.splitTextToSize(invoice.notes, contentWidth);
    doc.text(noteLines, margin, y);
    y += noteLines.length * 4.5 + 5;
  }

  // ══════════════════════════════════════════════
  // FOOTER
  // ══════════════════════════════════════════════
  const footerY = pageHeight - 20;
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('Thank you for your business!', pageWidth / 2, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${platformName}  |  ${supportEmail}  |  ${contactPhone}`,
    pageWidth / 2,
    footerY + 4,
    { align: 'center' },
  );

  // ── Status Watermark (drawn last to avoid GState opacity affecting other content) ──
  const status = invoice.status?.toLowerCase();
  let watermarkText = '';
  let watermarkColor: [number, number, number] = [0, 0, 0];
  let watermarkOpacity = 0;

  if (status === 'paid') {
    watermarkText = 'PAID';
    watermarkColor = [0, 160, 0];
    watermarkOpacity = 0.06;
  } else if (status === 'void') {
    watermarkText = 'VOID';
    watermarkColor = [200, 0, 0];
    watermarkOpacity = 0.08;
  } else if (status === 'overdue') {
    watermarkText = 'OVERDUE';
    watermarkColor = [200, 0, 0];
    watermarkOpacity = 0.06;
  }

  if (watermarkText) {
    doc.saveGraphicsState();
    // @ts-expect-error jsPDF internal GState
    doc.setGState(new doc.GState({ opacity: watermarkOpacity }));
    doc.setTextColor(...watermarkColor);
    doc.setFontSize(72);
    doc.setFont('helvetica', 'bold');
    const textWidth = doc.getTextWidth(watermarkText);
    doc.text(watermarkText, (pageWidth - textWidth * 0.7) / 2, pageHeight / 2, { angle: 45 });
    doc.restoreGraphicsState();
  }

  // Save the PDF
  doc.save(`${invoice.invoiceNumber}.pdf`);
}
