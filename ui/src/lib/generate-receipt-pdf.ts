import type { Invoice, Payment } from '@/types/invoices';
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

const PaymentMethodLabels: Record<string, string> = {
  mpesa: 'M-Pesa',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
  cash: 'Cash',
  waiver: 'Waiver',
};

/**
 * Generate a professional receipt PDF for a fully paid invoice showing all confirmed payments,
 * or for a single payment on a partially paid invoice.
 */
export async function generateReceiptPDF(
  invoice: Invoice,
  payments: Payment[],
  settings: SystemSetting | null,
  singlePayment?: Payment,
) {
  const primaryColor = settings?.primaryColor || '#000000';
  const secondaryColor = settings?.secondaryColor || '#D4A843';
  const platformName = settings?.platformName || 'iSpeak Academy';
  const contactPhone = settings?.contactPhone || '';
  const contactAddress = settings?.contactAddress || '';
  const supportEmail = settings?.supportEmail || '';
  const logoUrl = settings?.invoiceLogo || settings?.appLogo || '';

  const primaryRgb = hexToRgb(primaryColor);
  const secondaryRgb = hexToRgb(secondaryColor);

  // If single payment, only show that one; otherwise show all confirmed
  const receiptPayments = singlePayment
    ? [singlePayment]
    : payments.filter((p) => p.status === 'confirmed');

  const totalPaid = receiptPayments.reduce((sum, p) => sum + Number(p.amount), 0);

  const receiptNumber = singlePayment
    ? `RCT-${invoice.invoiceNumber}-${receiptPayments[0].paymentId.substring(0, 6).toUpperCase()}`
    : `RCT-${invoice.invoiceNumber}`;

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

  // "RECEIPT" title (right side)
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(30);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', pageWidth - margin, 25, { align: 'right' });

  // Receipt number below title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(receiptNumber, pageWidth - margin, 34, { align: 'right' });

  y = headerHeight + 12;

  // ══════════════════════════════════════════════
  // FROM (left) + RECEIPT DETAILS (right)
  // ══════════════════════════════════════════════

  // Section label: FROM
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FROM', margin, y);
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 1.5, margin + 14, y + 1.5);
  y += 6;

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

  // Receipt details — right column
  const detailsStartY = headerHeight + 18;
  const detailsX = pageWidth - margin;

  // Section label: RECEIPT DETAILS
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT DETAILS', detailsX - 55, detailsStartY - 6);
  doc.setDrawColor(...secondaryRgb);
  doc.line(detailsX - 55, detailsStartY - 4.5, detailsX - 14, detailsStartY - 4.5);

  const receiptDate = singlePayment
    ? formatDate(singlePayment.paymentDate)
    : invoice.paidDate
      ? formatDate(invoice.paidDate)
      : formatDate(new Date().toISOString());

  const detailItems: [string, string][] = [
    ['Receipt Date:', receiptDate],
    ['Invoice Ref:', invoice.invoiceNumber],
    ['Currency:', invoice.currency],
  ];

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
  // RECEIVED FROM
  // ══════════════════════════════════════════════
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIVED FROM', margin, y);
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 1.5, margin + 32, y + 1.5);
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
  // FOR — Invoice Line Items
  // ══════════════════════════════════════════════
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FOR', margin, y);
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 1.5, margin + 10, y + 1.5);
  y += 6;

  const lineItems = invoice.lineItems || [];
  const itemsBody = lineItems.map((item, idx) => [
    (idx + 1).toString(),
    item.description,
    item.quantity.toString(),
    formatCurrency(item.unitPrice, invoice.currency),
    formatCurrency(item.total, invoice.currency),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: itemsBody,
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
  // PAYMENT DETAILS TABLE
  // ══════════════════════════════════════════════
  doc.setTextColor(...secondaryRgb);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PAYMENT DETAILS', margin, y);
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.6);
  doc.line(margin, y + 1.5, margin + 38, y + 1.5);
  y += 6;

  const paymentBody = receiptPayments.map((p) => [
    formatDate(p.paymentDate),
    PaymentMethodLabels[p.method] || p.method,
    p.externalReference || '—',
    p.payerName || '—',
    formatCurrency(p.amount, p.currency),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Date', 'Method', 'Reference', 'Payer', 'Amount']],
    body: paymentBody,
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
      0: { cellWidth: 30 },
      1: { cellWidth: 30 },
      2: { cellWidth: 'auto' },
      3: { cellWidth: 35 },
      4: { cellWidth: 40, halign: 'right' },
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  // ══════════════════════════════════════════════
  // TOTALS SECTION
  // ══════════════════════════════════════════════
  const totalsX = pageWidth - margin - 85;
  const totalsValueX = pageWidth - margin;

  const drawRow = (label: string, value: string, bold = false, color?: [number, number, number]) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(color ? color[0] : 80, color ? color[1] : 80, color ? color[2] : 80);
    doc.setFontSize(bold ? 11 : 9);
    doc.text(label, totalsX, y);
    doc.text(value, totalsValueX, y, { align: 'right' });
    y += bold ? 7 : 5.5;
  };

  drawRow('Invoice Total', formatCurrency(invoice.totalAmount, invoice.currency));
  drawRow('Total Paid', formatCurrency(totalPaid, invoice.currency), false, [0, 128, 0]);

  const remaining = Number(invoice.totalAmount) - Number(invoice.amountPaid);
  if (remaining > 0 && !singlePayment) {
    drawRow('Balance Remaining', formatCurrency(remaining, invoice.currency), false, [200, 0, 0]);
  }

  // Divider before stamp
  doc.setDrawColor(...secondaryRgb);
  doc.setLineWidth(0.5);
  doc.line(totalsX, y, totalsValueX, y);
  y += 5;

  // Status box
  const boxWidth = totalsValueX - totalsX + 10;
  doc.setFillColor(0, 140, 0);
  doc.roundedRect(totalsX - 5, y - 4, boxWidth, 10, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  if (Number(invoice.balance) <= 0 && !singlePayment) {
    doc.text('PAID IN FULL', (totalsX + totalsValueX) / 2, y + 3, { align: 'center' });
  } else {
    doc.text(
      `Received: ${formatCurrency(totalPaid, invoice.currency)}`,
      (totalsX + totalsValueX) / 2,
      y + 3,
      { align: 'center' },
    );
  }
  y += 16;

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
  doc.text('Thank you for your payment!', pageWidth / 2, footerY, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.text(
    `${platformName}  |  ${supportEmail}  |  ${contactPhone}`,
    pageWidth / 2,
    footerY + 4,
    { align: 'center' },
  );

  // ── Status Watermark — PAID always on receipts (drawn last to avoid GState affecting other content) ──
  doc.saveGraphicsState();
  // @ts-expect-error jsPDF internal GState
  doc.setGState(new doc.GState({ opacity: 0.06 }));
  doc.setTextColor(0, 160, 0);
  doc.setFontSize(72);
  doc.setFont('helvetica', 'bold');
  const wmText = 'PAID';
  const wmWidth = doc.getTextWidth(wmText);
  doc.text(wmText, (pageWidth - wmWidth * 0.7) / 2, pageHeight / 2, { angle: 45 });
  doc.restoreGraphicsState();

  // Save the PDF
  const filename = singlePayment
    ? `Receipt-${invoice.invoiceNumber}-${singlePayment.paymentId.substring(0, 6).toUpperCase()}.pdf`
    : `Receipt-${invoice.invoiceNumber}.pdf`;
  doc.save(filename);
}
