import { InvoiceStatus, InvoiceType, PaymentMethod, PaymentStatus } from './enums';

export interface InvoiceLineItem {
  lineItemId: string;
  invoiceId: string;
  description: string;
  programId?: string | null;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface InvoicePaymentPlan {
  planId: string;
  invoiceId: string;
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: string;
  paidDate?: string | null;
  paymentId?: string | null;
}

export interface Invoice {
  invoiceId: string;
  invoiceNumber: string;
  clientId?: string | null;
  organisationId?: string | null;
  enrollmentId?: string | null;
  type: InvoiceType;
  status: InvoiceStatus;
  currency: string;
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  issueDate: string;
  dueDate: string;
  paidDate?: string | null;
  voidedDate?: string | null;
  voidReason?: string | null;
  vatApplicable: boolean;
  notes?: string | null;
  purchaseOrderNumber?: string | null;
  paymentInstructions?: {
    mpesa?: { paybillNumber: string; accountNumber: string };
    bankTransfer?: { bankName: string; accountName: string; accountNumber: string; swiftCode?: string };
  } | null;
  createdByEmployeeId: string;
  lineItems?: InvoiceLineItem[];
  paymentPlan?: InvoicePaymentPlan[];
  createdAt: string;
  updatedAt: string;
  client?: { clientId: string; firstName: string; lastName: string; email?: string; phone?: string };
}

export interface Payment {
  paymentId: string;
  invoiceId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: PaymentStatus;
  externalReference?: string | null;
  mpesaTransactionId?: string | null;
  mpesaPhoneNumber?: string | null;
  payerName?: string | null;
  paymentDate: string;
  notes?: string | null;
  recordedByEmployeeId?: string | null;
  isAutoReconciled: boolean;
  receiptUrl?: string | null;
  createdAt: string;
}

export interface CreateInvoiceDto {
  clientId?: string;
  organisationId?: string;
  enrollmentId?: string;
  type: InvoiceType;
  currency?: string;
  lineItems: { description: string; unitPrice: number; quantity?: number; programId?: string }[];
  discountPercent?: number;
  taxPercent?: number;
  dueDate: string;
  notes?: string;
}

export interface RecordPaymentDto {
  amount: number;
  currency: string;
  method: PaymentMethod;
  paymentDate: string;
  externalReference?: string;
  payerName?: string;
  notes?: string;
}

export interface QueryInvoicesDto {
  page?: number;
  limit?: number;
  status?: InvoiceStatus;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
}
