'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import StatusTag from '@/components/admin/StatusTag';
import { useClients } from '@/hooks/useClients';
import {
  useInvoice,
  useInvoicePayments,
  useRecordPayment,
  useSendInvoice,
  useUpdateInvoice,
  useVoidInvoice,
} from '@/hooks/useInvoices';
import { useSettings } from '@/hooks/useSettings';
import { generateInvoicePDF } from '@/lib/generate-invoice-pdf';
import { generateReceiptPDF } from '@/lib/generate-receipt-pdf';
import type { CreateInvoiceDto, Payment, RecordPaymentDto } from '@/types/invoices';
import {
  InvoiceStatus,
  InvoiceTypeLabels,
  InvoiceType,
  PaymentMethodLabels,
  PaymentStatusLabels,
} from '@/types/enums';
import {
  DeleteOutlined,
  DollarOutlined,
  DownloadOutlined,
  EditOutlined,
  FileDoneOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SendOutlined,
  StopOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Skeleton,
  Table,
  Tag,
  Typography,
} from 'antd';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';

const { Text, Title } = Typography;

export default function InvoiceDetailPage() {
  const params = useParams();
  const invoiceId = params.id as string;

  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { data: paymentsData, isLoading: loadingPayments } = useInvoicePayments(invoiceId);
  const { data: settings } = useSettings();
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const recordPayment = useRecordPayment();
  const updateInvoice = useUpdateInvoice();

  const [paymentDrawer, setPaymentDrawer] = useState(false);
  const [editDrawer, setEditDrawer] = useState(false);
  const [voidModal, setVoidModal] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data: clientsData, isLoading: loadingClients } = useClients({
    page: 1,
    limit: 50,
    search: clientSearch || undefined,
  });

  const clientOptions = useMemo(() => {
    const clients = clientsData?.data || [];
    return clients.map((c: any) => ({
      value: c.clientId,
      label: `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ''}`,
    }));
  }, [clientsData]);

  // Pre-fill edit form when invoice loads
  useEffect(() => {
    if (invoice && editDrawer) {
      editForm.setFieldsValue({
        clientId: invoice.clientId,
        type: invoice.type,
        currency: invoice.currency,
        lineItems: invoice.lineItems?.map((item) => ({
          description: item.description,
          unitPrice: Number(item.unitPrice),
          quantity: item.quantity,
        })) || [{}],
        discountPercent: Number(invoice.discountPercent) || undefined,
        taxPercent: Number(invoice.taxPercent) || undefined,
        dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : undefined,
        notes: invoice.notes,
      });
    }
  }, [invoice, editDrawer, editForm]);

  const handleRecordPayment = async (values: any) => {
    const data: RecordPaymentDto = {
      amount: values.amount,
      currency: values.currency || invoice?.currency || 'KES',
      method: values.method,
      paymentDate: values.paymentDate?.toISOString() || new Date().toISOString(),
      externalReference: values.externalReference,
      payerName: values.payerName,
      notes: values.notes,
    };
    await recordPayment.mutateAsync({ invoiceId, data });
    setPaymentDrawer(false);
    form.resetFields();
  };

  const handleVoid = async () => {
    if (!voidReason.trim()) return;
    await voidInvoice.mutateAsync({ id: invoiceId, reason: voidReason });
    setVoidModal(false);
    setVoidReason('');
  };

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    setPdfLoading(true);
    try {
      await generateInvoicePDF(invoice, settings || null);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  const handleDownloadReceipt = async (singlePayment?: Payment) => {
    if (!invoice) return;
    setReceiptLoading(true);
    try {
      const allPayments = Array.isArray(payments) ? payments : [];
      await generateReceiptPDF(invoice, allPayments, settings || null, singlePayment);
    } catch (err) {
      console.error('Failed to generate receipt:', err);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleEditInvoice = async (values: any) => {
    const dto: Partial<CreateInvoiceDto> = {
      clientId: values.clientId,
      type: values.type,
      currency: values.currency,
      lineItems: values.lineItems.map((item: any) => ({
        description: item.description,
        unitPrice: Number(item.unitPrice),
        quantity: Number(item.quantity || 1),
      })),
      discountPercent: values.discountPercent ? Number(values.discountPercent) : 0,
      taxPercent: values.taxPercent ? Number(values.taxPercent) : 0,
      dueDate: values.dueDate?.toISOString() || undefined,
      notes: values.notes,
    };
    await updateInvoice.mutateAsync({ id: invoiceId, data: dto });
    setEditDrawer(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    );
  }

  if (!invoice) {
    return <EmptyState title="Invoice not found" description="The invoice you're looking for doesn't exist" />;
  }

  const canSend = invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE;
  const canRecordPayment = invoice.status !== InvoiceStatus.VOID && invoice.status !== InvoiceStatus.PAID;
  const canVoid = invoice.status !== InvoiceStatus.VOID && invoice.status !== InvoiceStatus.PAID;
  const canEdit = invoice.status === InvoiceStatus.DRAFT || invoice.status === InvoiceStatus.SENT || invoice.status === InvoiceStatus.OVERDUE || invoice.status === InvoiceStatus.PARTIAL;

  const payments = paymentsData?.payments || (paymentsData as any) || [];

  return (
    <>
      <PageHeader
        title={invoice.invoiceNumber}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Invoices', href: '/admin/invoices' },
          { label: invoice.invoiceNumber },
        ]}
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              icon={<DownloadOutlined />}
              onClick={handleDownloadPDF}
              loading={pdfLoading}
            >
              Download PDF
            </Button>
            {Number(invoice.amountPaid) > 0 && (
              <Button
                icon={<FileDoneOutlined />}
                onClick={() => handleDownloadReceipt()}
                loading={receiptLoading}
              >
                Download Receipt
              </Button>
            )}
            {canEdit && (
              <Button
                icon={<EditOutlined />}
                onClick={() => setEditDrawer(true)}
              >
                Edit
              </Button>
            )}
            {canSend && (
              <Button
                icon={<SendOutlined />}
                onClick={() => sendInvoice.mutate(invoiceId)}
                loading={sendInvoice.isPending}
              >
                Send Invoice
              </Button>
            )}
            {canRecordPayment && (
              <Button
                type="primary"
                icon={<WalletOutlined />}
                onClick={() => setPaymentDrawer(true)}
              >
                Record Payment
              </Button>
            )}
            {canVoid && (
              <Button danger icon={<StopOutlined />} onClick={() => setVoidModal(true)}>
                Void
              </Button>
            )}
          </div>
        }
      />

      {/* Invoice Header */}
      <Card size="small" className="mb-6">
        {/* Logo + Invoice Label */}
        {settings && (settings.invoiceLogo || settings.appLogo) && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
            <img
              src={settings.invoiceLogo || settings.appLogo}
              alt={settings.platformName || 'Company Logo'}
              className="h-12 object-contain"
            />
            <div className="text-right">
              <Title level={3} className="!mb-0 !text-gray-800">INVOICE</Title>
            </div>
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Title level={4} className="!mb-0">{invoice.invoiceNumber}</Title>
              <StatusTag type="invoice" status={invoice.status} />
              <Tag>{InvoiceTypeLabels[invoice.type] || invoice.type}</Tag>
            </div>
            {invoice.client && (
              <div className="flex flex-wrap gap-4 mt-1">
                <Link href={`/admin/clients/${invoice.client.clientId}`} className="text-blue-600 hover:text-blue-800">
                  <Text className="text-sm flex items-center gap-1">
                    <UserOutlined /> {invoice.client.firstName} {invoice.client.lastName}
                  </Text>
                </Link>
                {invoice.client.email && (
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <MailOutlined /> {invoice.client.email}
                  </Text>
                )}
                {invoice.client.phone && (
                  <Text type="secondary" className="text-sm flex items-center gap-1">
                    <PhoneOutlined /> {invoice.client.phone}
                  </Text>
                )}
              </div>
            )}
          </div>
          <div className="text-right">
            <Text type="secondary" className="text-sm">Total Amount</Text>
            <div className="text-2xl font-bold">
              {invoice.currency} {Number(invoice.totalAmount).toLocaleString()}
            </div>
            {Number(invoice.balance) > 0 && (
              <Text type="danger" className="text-sm">
                Balance: {invoice.currency} {Number(invoice.balance).toLocaleString()}
              </Text>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line Items */}
          <Card title="Line Items" size="small">
            <Table
              dataSource={invoice.lineItems || []}
              rowKey="lineItemId"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Description',
                  dataIndex: 'description',
                  key: 'description',
                },
                {
                  title: 'Unit Price',
                  dataIndex: 'unitPrice',
                  key: 'unitPrice',
                  width: 120,
                  align: 'right',
                  render: (v: number) => `${invoice.currency} ${Number(v).toLocaleString()}`,
                },
                {
                  title: 'Qty',
                  dataIndex: 'quantity',
                  key: 'quantity',
                  width: 60,
                  align: 'center',
                },
                {
                  title: 'Total',
                  dataIndex: 'total',
                  key: 'total',
                  width: 140,
                  align: 'right',
                  render: (v: number) => (
                    <Text strong>{invoice.currency} {Number(v).toLocaleString()}</Text>
                  ),
                },
              ]}
            />

            {/* Totals */}
            <div className="mt-4 border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <Text type="secondary">Subtotal</Text>
                <Text>{invoice.currency} {Number(invoice.subtotal).toLocaleString()}</Text>
              </div>
              {Number(invoice.discountPercent) > 0 && (
                <div className="flex justify-between">
                  <Text type="secondary">Discount ({invoice.discountPercent}%)</Text>
                  <Text type="success">-{invoice.currency} {Number(invoice.discountAmount).toLocaleString()}</Text>
                </div>
              )}
              {Number(invoice.taxPercent) > 0 && (
                <div className="flex justify-between">
                  <Text type="secondary">Tax / VAT ({invoice.taxPercent}%)</Text>
                  <Text>{invoice.currency} {Number(invoice.taxAmount).toLocaleString()}</Text>
                </div>
              )}
              <div className="flex justify-between border-t pt-2">
                <Text strong className="text-base">Total</Text>
                <Text strong className="text-base">{invoice.currency} {Number(invoice.totalAmount).toLocaleString()}</Text>
              </div>
              <div className="flex justify-between">
                <Text type="secondary">Amount Paid</Text>
                <Text type="success">{invoice.currency} {Number(invoice.amountPaid).toLocaleString()}</Text>
              </div>
              <div className="flex justify-between border-t pt-2">
                <Text strong>Balance Due</Text>
                <Text strong type={Number(invoice.balance) > 0 ? 'danger' : 'success'}>
                  {invoice.currency} {Number(invoice.balance).toLocaleString()}
                </Text>
              </div>
            </div>
          </Card>

          {/* Payment History */}
          <Card title="Payment History" size="small" extra={
            canRecordPayment && (
              <Button size="small" icon={<WalletOutlined />} onClick={() => setPaymentDrawer(true)}>
                Record Payment
              </Button>
            )
          }>
            <Table
              dataSource={Array.isArray(payments) ? payments : []}
              loading={loadingPayments}
              rowKey="paymentId"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Date',
                  dataIndex: 'paymentDate',
                  key: 'paymentDate',
                  render: (d: string) => new Date(d).toLocaleDateString(),
                },
                {
                  title: 'Method',
                  dataIndex: 'method',
                  key: 'method',
                  render: (m: string) => PaymentMethodLabels[m as keyof typeof PaymentMethodLabels] || m,
                },
                {
                  title: 'Amount',
                  dataIndex: 'amount',
                  key: 'amount',
                  align: 'right',
                  render: (v: number, record: any) => (
                    <Text strong type="success">{record.currency} {Number(v).toLocaleString()}</Text>
                  ),
                },
                {
                  title: 'Reference',
                  dataIndex: 'externalReference',
                  key: 'ref',
                  render: (v: string) => v || <Text type="secondary">-</Text>,
                },
                {
                  title: 'Status',
                  dataIndex: 'status',
                  key: 'status',
                  render: (s: string) => {
                    const label = PaymentStatusLabels[s as keyof typeof PaymentStatusLabels] || s;
                    const color = s === 'confirmed' ? 'success' : s === 'failed' ? 'error' : s === 'reversed' ? 'warning' : 'processing';
                    return <Tag color={color}>{label}</Tag>;
                  },
                },
                {
                  title: '',
                  key: 'actions',
                  width: 50,
                  render: (_: unknown, record: Payment) =>
                    record.status === 'confirmed' ? (
                      <Button
                        type="text"
                        size="small"
                        icon={<FileDoneOutlined />}
                        onClick={() => handleDownloadReceipt(record)}
                        title="Download Receipt"
                      />
                    ) : null,
                },
              ]}
              locale={{
                emptyText: (
                  <EmptyState
                    icon={<DollarOutlined />}
                    title="No payments recorded"
                    description="Payments will appear here when recorded"
                  />
                ),
              }}
            />
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Client Card */}
          {invoice.client && (
            <Card title="Client" size="small">
              <div className="space-y-2">
                <div>
                  <Link href={`/admin/clients/${invoice.client.clientId}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    {invoice.client.firstName} {invoice.client.lastName}
                  </Link>
                </div>
                {invoice.client.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MailOutlined /> {invoice.client.email}
                  </div>
                )}
                {invoice.client.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <PhoneOutlined /> {invoice.client.phone}
                  </div>
                )}
              </div>
            </Card>
          )}

          <Card title="Invoice Details" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Issue Date">
                {new Date(invoice.issueDate).toLocaleDateString()}
              </Descriptions.Item>
              <Descriptions.Item label="Due Date">
                {new Date(invoice.dueDate).toLocaleDateString()}
              </Descriptions.Item>
              {invoice.paidDate && (
                <Descriptions.Item label="Paid Date">
                  {new Date(invoice.paidDate).toLocaleDateString()}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Currency">{invoice.currency}</Descriptions.Item>
              {invoice.vatApplicable && (
                <Descriptions.Item label="VAT">Applicable</Descriptions.Item>
              )}
              {invoice.purchaseOrderNumber && (
                <Descriptions.Item label="PO Number">{invoice.purchaseOrderNumber}</Descriptions.Item>
              )}
              <Descriptions.Item label="Created">
                {new Date(invoice.createdAt).toLocaleDateString()}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {invoice.notes && (
            <Card title="Notes" size="small">
              <Text>{invoice.notes}</Text>
            </Card>
          )}

          {invoice.voidReason && (
            <Card title="Void Reason" size="small">
              <Text type="danger">{invoice.voidReason}</Text>
              {invoice.voidedDate && (
                <div className="mt-1">
                  <Text type="secondary" className="text-xs">
                    Voided on {new Date(invoice.voidedDate).toLocaleDateString()}
                  </Text>
                </div>
              )}
            </Card>
          )}

          {/* Installment Plan */}
          {invoice.paymentPlan && invoice.paymentPlan.length > 0 && (
            <Card title="Payment Plan" size="small">
              <div className="space-y-2">
                {invoice.paymentPlan.map((plan) => (
                  <div key={plan.planId} className="flex justify-between items-center text-sm">
                    <div>
                      <Text>Installment {plan.installmentNumber}</Text>
                      <br />
                      <Text type="secondary" className="text-xs">
                        Due: {new Date(plan.dueDate).toLocaleDateString()}
                      </Text>
                    </div>
                    <div className="text-right">
                      <Text strong>{invoice.currency} {Number(plan.amount).toLocaleString()}</Text>
                      <br />
                      <Tag color={plan.status === 'paid' ? 'success' : plan.status === 'overdue' ? 'error' : 'default'} className="mt-0.5">
                        {plan.status}
                      </Tag>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Record Payment Drawer */}
      <Drawer
        title="Record Payment"
        open={paymentDrawer}
        onClose={() => setPaymentDrawer(false)}
        width={420}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleRecordPayment}>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={0} className="w-full" placeholder="Enter amount" />
          </Form.Item>
          <Form.Item name="currency" label="Currency" initialValue={invoice?.currency || 'KES'}>
            <Select options={[
              { value: 'KES', label: 'KES' },
              { value: 'USD', label: 'USD' },
              { value: 'GBP', label: 'GBP' },
              { value: 'EUR', label: 'EUR' },
            ]} />
          </Form.Item>
          <Form.Item name="method" label="Payment Method" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select method"
              options={Object.entries(PaymentMethodLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="paymentDate" label="Payment Date" rules={[{ required: true, message: 'Required' }]}>
            <DatePicker className="w-full" />
          </Form.Item>
          <Form.Item name="externalReference" label="Reference / Receipt #">
            <Input placeholder="M-Pesa code, bank ref, etc." />
          </Form.Item>
          <Form.Item name="payerName" label="Payer Name">
            <Input placeholder="Name on payment" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setPaymentDrawer(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={recordPayment.isPending}>
              Record Payment
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Edit Invoice Drawer */}
      <Drawer
        title="Edit Invoice"
        open={editDrawer}
        onClose={() => setEditDrawer(false)}
        width={600}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditInvoice} initialValues={{ lineItems: [{}] }}>
          <Form.Item name="clientId" label="Client">
            <Select
              showSearch
              placeholder="Search client..."
              filterOption={false}
              onSearch={(val) => setClientSearch(val)}
              loading={loadingClients}
              options={clientOptions}
              allowClear
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="type" label="Invoice Type" rules={[{ required: true, message: 'Required' }]}>
              <Select
                options={Object.entries(InvoiceTypeLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="currency" label="Currency" rules={[{ required: true, message: 'Required' }]}>
              <Select options={[
                { value: 'KES', label: 'KES' },
                { value: 'USD', label: 'USD' },
                { value: 'GBP', label: 'GBP' },
                { value: 'EUR', label: 'EUR' },
              ]} />
            </Form.Item>
          </div>

          {/* Line Items */}
          <div className="mb-2">
            <Text strong>Line Items</Text>
          </div>
          <Form.List name="lineItems" rules={[{
            validator: async (_, items) => {
              if (!items || items.length < 1) throw new Error('Add at least one line item');
            },
          }]}>
            {(fields, { add, remove }) => (
              <div className="space-y-3">
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="border border-gray-200 rounded-md p-3">
                    <Form.Item
                      {...restField}
                      name={[name, 'description']}
                      label="Description"
                      rules={[{ required: true, message: 'Required' }]}
                      className="!mb-2"
                    >
                      <Input placeholder="e.g., SPP-303 Speech & Pitch Program" />
                    </Form.Item>
                    <div className="grid grid-cols-3 gap-x-3">
                      <Form.Item
                        {...restField}
                        name={[name, 'unitPrice']}
                        label="Unit Price"
                        rules={[{ required: true, message: 'Required' }]}
                        className="!mb-0"
                      >
                        <InputNumber min={0} step={0.01} className="w-full" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Quantity"
                        initialValue={1}
                        className="!mb-0"
                      >
                        <InputNumber min={1} className="w-full" />
                      </Form.Item>
                      <div className="flex items-end">
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                  Add Line Item
                </Button>
              </div>
            )}
          </Form.List>

          <div className="grid grid-cols-2 gap-x-4 mt-4">
            <Form.Item name="discountPercent" label="Discount (%)">
              <InputNumber min={0} max={100} className="w-full" placeholder="0" />
            </Form.Item>
            <Form.Item name="taxPercent" label="Tax / VAT (%)">
              <InputNumber min={0} max={100} className="w-full" placeholder="0" />
            </Form.Item>
          </div>

          <Form.Item name="dueDate" label="Due Date">
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setEditDrawer(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateInvoice.isPending}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Void Modal */}
      <Modal
        title="Void Invoice"
        open={voidModal}
        onCancel={() => { setVoidModal(false); setVoidReason(''); }}
        onOk={handleVoid}
        confirmLoading={voidInvoice.isPending}
        okText="Void Invoice"
        okButtonProps={{ danger: true }}
      >
        <div className="mt-4">
          <Text>This action cannot be undone. Please provide a reason:</Text>
          <Input.TextArea
            rows={3}
            value={voidReason}
            onChange={(e) => setVoidReason(e.target.value)}
            placeholder="Reason for voiding..."
            className="mt-2"
          />
        </div>
      </Modal>
    </>
  );
}
