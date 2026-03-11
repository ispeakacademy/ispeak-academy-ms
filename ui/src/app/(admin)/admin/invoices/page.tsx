'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import StatusTag from '@/components/admin/StatusTag';
import { useClients } from '@/hooks/useClients';
import { useEnrollments } from '@/hooks/useEnrollments';
import {
  useCreateInvoice,
  useEnrollmentInvoicedAmount,
  useInvoices,
  useRecordPayment,
  useSendInvoice,
  useUpdateInvoice,
  useVoidInvoice,
} from '@/hooks/useInvoices';
import type { CreateInvoiceDto, Invoice, QueryInvoicesDto, RecordPaymentDto } from '@/types/invoices';
import type { Enrollment } from '@/types/enrollments';
import {
  EnrollmentStatus,
  InvoiceStatus,
  InvoiceStatusLabels,
  InvoiceType,
  InvoiceTypeLabels,
  PaymentMethod,
  PaymentMethodLabels,
} from '@/types/enums';
import {
  DeleteOutlined,
  DollarOutlined,
  EditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  SendOutlined,
  StopOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Alert, Button, DatePicker, Drawer, Form, Input, InputNumber, Modal, Select, Space, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

const { Text } = Typography;

const statusTabs = [
  { key: '', label: 'All' },
  ...Object.entries(InvoiceStatusLabels).map(([value, label]) => ({ key: value, label })),
];

export default function InvoicesPage() {
  const [query, setQuery] = useState<QueryInvoicesDto>({ page: 1, limit: 20 });
  const [activeTab, setActiveTab] = useState('');
  const [paymentDrawer, setPaymentDrawer] = useState<{ open: boolean; invoiceId: string }>({ open: false, invoiceId: '' });
  const [voidModal, setVoidModal] = useState<{ open: boolean; invoiceId: string }>({ open: false, invoiceId: '' });
  const [voidReason, setVoidReason] = useState('');
  const [createDrawer, setCreateDrawer] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | undefined>();
  const [selectedEnrollmentId, setSelectedEnrollmentId] = useState<string | undefined>();
  const [form] = Form.useForm();
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data, isLoading } = useInvoices(query);
  const sendInvoice = useSendInvoice();
  const voidInvoice = useVoidInvoice();
  const recordPayment = useRecordPayment();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { data: clientsData, isLoading: loadingClients } = useClients({
    page: 1,
    limit: 50,
    search: clientSearch || undefined,
  });

  // Fetch enrollments for selected client (APPROVED + INVOICE_SENT)
  const { data: approvedEnrollments } = useEnrollments(
    selectedClientId ? { clientId: selectedClientId, status: EnrollmentStatus.APPROVED, limit: 50 } : undefined,
  );
  const { data: invoiceSentEnrollments } = useEnrollments(
    selectedClientId ? { clientId: selectedClientId, status: EnrollmentStatus.INVOICE_SENT, limit: 50 } : undefined,
  );

  const clientEnrollments = useMemo(() => {
    const approved = approvedEnrollments?.data || [];
    const invoiceSent = invoiceSentEnrollments?.data || [];
    return [...approved, ...invoiceSent];
  }, [approvedEnrollments, invoiceSentEnrollments]);

  // Fetch invoiced amount for selected enrollment
  const { data: invoicedAmountData } = useEnrollmentInvoicedAmount(selectedEnrollmentId);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      status: key ? (key as InvoiceStatus) : undefined,
    }));
  }, []);

  const handleVoid = async () => {
    if (!voidReason.trim()) return;
    await voidInvoice.mutateAsync({ id: voidModal.invoiceId, reason: voidReason });
    setVoidModal({ open: false, invoiceId: '' });
    setVoidReason('');
  };

  const handleRecordPayment = async (values: any) => {
    const data: RecordPaymentDto = {
      amount: values.amount,
      currency: values.currency || 'KES',
      method: values.method,
      paymentDate: values.paymentDate?.toISOString() || new Date().toISOString(),
      externalReference: values.externalReference,
      payerName: values.payerName,
      notes: values.notes,
    };
    await recordPayment.mutateAsync({ invoiceId: paymentDrawer.invoiceId, data });
    setPaymentDrawer({ open: false, invoiceId: '' });
    form.resetFields();
  };

  const handleCreateInvoice = async (values: any) => {
    const dto: CreateInvoiceDto = {
      clientId: values.clientId,
      enrollmentId: selectedEnrollmentId,
      type: values.type,
      currency: values.currency,
      lineItems: values.lineItems.map((item: any) => ({
        description: item.description,
        unitPrice: Number(item.unitPrice),
        quantity: Number(item.quantity || 1),
      })),
      discountPercent: values.discountPercent ? Number(values.discountPercent) : undefined,
      taxPercent: values.taxPercent ? Number(values.taxPercent) : undefined,
      dueDate: values.dueDate?.toISOString(),
      notes: values.notes,
    };
    await createInvoice.mutateAsync(dto);
    setCreateDrawer(false);
    setSelectedClientId(undefined);
    setSelectedEnrollmentId(undefined);
    createForm.resetFields();
  };

  // Handle client selection change
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedEnrollmentId(undefined);
    // Reset enrollment-related fields
    createForm.setFieldsValue({
      enrollmentId: undefined,
    });
  };

  // Handle enrollment selection change
  const handleEnrollmentChange = (enrollmentId: string | undefined) => {
    setSelectedEnrollmentId(enrollmentId || undefined);

    if (enrollmentId) {
      const enrollment = clientEnrollments.find((e) => e.enrollmentId === enrollmentId);
      if (enrollment) {
        // Lock currency to enrollment currency
        createForm.setFieldsValue({
          currency: enrollment.agreedCurrency,
        });

        // Auto-populate first line item
        const programName = enrollment.program?.name || enrollment.programId;
        const cohortCode = enrollment.cohort?.batchCode || enrollment.cohort?.name || '';
        const description = cohortCode ? `${programName} — ${cohortCode}` : programName;

        // We'll set the unit price after invoicedAmountData loads (via useEffect)
        createForm.setFieldsValue({
          lineItems: [{
            description,
            unitPrice: undefined,
            quantity: 1,
          }],
        });
      }
    } else {
      // Clear enrollment-specific overrides
      createForm.setFieldsValue({
        lineItems: [{}],
      });
    }
  };

  // Update line item price when invoicedAmountData loads
  useEffect(() => {
    if (selectedEnrollmentId && invoicedAmountData) {
      const currentLineItems = createForm.getFieldValue('lineItems');
      if (currentLineItems?.length > 0 && currentLineItems[0]?.unitPrice === undefined) {
        createForm.setFieldsValue({
          lineItems: currentLineItems.map((item: any, idx: number) =>
            idx === 0 ? { ...item, unitPrice: invoicedAmountData.remaining } : item,
          ),
        });
      }
    }
  }, [invoicedAmountData, selectedEnrollmentId, createForm]);

  const openEditDrawer = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    editForm.setFieldsValue({
      type: invoice.type,
      currency: invoice.currency,
      discountPercent: Number(invoice.discountPercent) || undefined,
      taxPercent: Number(invoice.taxPercent) || undefined,
      dueDate: invoice.dueDate ? dayjs(invoice.dueDate) : undefined,
      notes: invoice.notes,
      lineItems: invoice.lineItems?.map((li) => ({
        description: li.description,
        unitPrice: Number(li.unitPrice),
        quantity: li.quantity,
      })) || [{}],
    });
    setEditDrawerOpen(true);
  };

  const handleEdit = async (values: any) => {
    if (!editingInvoice) return;
    const dto: Partial<CreateInvoiceDto> = {
      type: values.type,
      currency: values.currency,
      lineItems: values.lineItems.map((item: any) => ({
        description: item.description,
        unitPrice: Number(item.unitPrice),
        quantity: Number(item.quantity || 1),
      })),
      discountPercent: values.discountPercent ? Number(values.discountPercent) : undefined,
      taxPercent: values.taxPercent ? Number(values.taxPercent) : undefined,
      dueDate: values.dueDate?.toISOString(),
      notes: values.notes,
    };
    await updateInvoice.mutateAsync({ id: editingInvoice.invoiceId, data: dto });
    setEditDrawerOpen(false);
    setEditingInvoice(null);
    editForm.resetFields();
  };

  const clientOptions = useMemo(() => {
    const clients = clientsData?.data || [];
    return clients.map((c: any) => ({
      value: c.clientId,
      label: `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ''}`,
    }));
  }, [clientsData]);

  const enrollmentOptions = useMemo(() => {
    return clientEnrollments.map((e: Enrollment) => {
      const programName = e.program?.name || e.programId;
      const cohortCode = e.cohort?.batchCode || e.cohort?.name || 'No cohort';
      return {
        value: e.enrollmentId,
        label: `${programName} — ${cohortCode} — Agreed: ${e.agreedCurrency} ${Number(e.agreedAmount).toLocaleString()}`,
      };
    });
  }, [clientEnrollments]);

  // Compute summary stats from loaded data
  const stats = useMemo(() => {
    const invoices = data?.data || [];
    const totalOutstanding = invoices.reduce((sum, inv) => sum + Number(inv.balance || 0), 0);
    const overdue = invoices.filter((inv) => inv.status === InvoiceStatus.OVERDUE);
    const paidThisMonth = invoices.filter((inv) => {
      if (inv.status !== InvoiceStatus.PAID || !inv.paidDate) return false;
      const paidDate = new Date(inv.paidDate);
      const now = new Date();
      return paidDate.getMonth() === now.getMonth() && paidDate.getFullYear() === now.getFullYear();
    });
    return {
      outstanding: totalOutstanding,
      overdueCount: overdue.length,
      collectedThisMonth: paidThisMonth.reduce((sum, inv) => sum + Number(inv.amountPaid || 0), 0),
    };
  }, [data]);

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (num: string, record) => (
        <Link href={`/admin/invoices/${record.invoiceId}`} className="text-blue-600 hover:text-blue-800">
          <Text strong>{num}</Text>
        </Link>
      ),
    },
    {
      title: 'Client',
      key: 'client',
      responsive: ['md'],
      render: (_, record) => record.client
        ? `${record.client.firstName} ${record.client.lastName}`
        : '-',
    },
    {
      title: 'Amount',
      key: 'amount',
      render: (_, record) => `${record.currency} ${Number(record.totalAmount).toLocaleString()}`,
    },
    {
      title: 'Balance',
      key: 'balance',
      render: (_, record) => (
        <Text type={Number(record.balance) > 0 ? 'danger' : 'success'}>
          {record.currency} {Number(record.balance).toLocaleString()}
        </Text>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag type="invoice" status={status} />,
    },
    {
      title: 'Due Date',
      dataIndex: 'dueDate',
      key: 'dueDate',
      responsive: ['lg'],
      render: (d: string) => new Date(d).toLocaleDateString(),
    },
    {
      title: '',
      key: 'actions',
      width: 160,
      render: (_, record) => (
        <Space size={0}>
          <Tooltip title="View">
            <Link href={`/admin/invoices/${record.invoiceId}`}>
              <Button type="text" size="small" icon={<EyeOutlined />} />
            </Link>
          </Tooltip>
          {(record.status === InvoiceStatus.DRAFT || record.status === InvoiceStatus.SENT || record.status === InvoiceStatus.OVERDUE || record.status === InvoiceStatus.PARTIAL) && (
            <Tooltip title="Edit">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => openEditDrawer(record)}
              />
            </Tooltip>
          )}
          {(record.status === InvoiceStatus.DRAFT || record.status === InvoiceStatus.SENT || record.status === InvoiceStatus.OVERDUE) && (
            <Tooltip title="Send Invoice">
              <Button
                type="text"
                size="small"
                icon={<SendOutlined />}
                onClick={() => sendInvoice.mutate(record.invoiceId)}
                loading={sendInvoice.isPending}
              />
            </Tooltip>
          )}
          {record.status !== InvoiceStatus.VOID && record.status !== InvoiceStatus.PAID && (
            <Tooltip title="Record Payment">
              <Button
                type="text"
                size="small"
                icon={<WalletOutlined className="text-green-600" />}
                onClick={() => setPaymentDrawer({ open: true, invoiceId: record.invoiceId })}
              />
            </Tooltip>
          )}
          {record.status !== InvoiceStatus.VOID && record.status !== InvoiceStatus.PAID && (
            <Tooltip title="Void Invoice">
              <Button
                type="text"
                size="small"
                icon={<StopOutlined className="text-red-600" />}
                onClick={() => setVoidModal({ open: true, invoiceId: record.invoiceId })}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Invoices"
        subtitle="Manage invoices and payments"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Invoices' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateDrawer(true)}>
            Create Invoice
          </Button>
        }
      />

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Total Outstanding"
          value={stats.outstanding}
          prefix="KES "
          icon={<DollarOutlined />}
        />
        <StatCard
          label="Overdue Invoices"
          value={stats.overdueCount}
          icon={<ExclamationCircleOutlined />}
          valueClassName={stats.overdueCount > 0 ? 'text-red-600' : undefined}
        />
        <StatCard
          label="Collected This Month"
          value={stats.collectedThisMonth}
          prefix="KES "
          icon={<WalletOutlined />}
        />
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusTabs.map((tab) => (
          <Button
            key={tab.key}
            type={activeTab === tab.key ? 'primary' : 'default'}
            size="small"
            onClick={() => handleTabChange(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      <Table
        dataSource={data?.data || []}
        columns={columns}
        loading={isLoading}
        rowKey="invoiceId"
        size="small"
        scroll={{ x: true }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `${total} invoices`,
          onChange: (page, pageSize) => setQuery((prev) => ({ ...prev, page, limit: pageSize })),
        }}
        locale={{
          emptyText: (
            <EmptyState
              icon={<DollarOutlined />}
              title="No invoices"
              description="Create your first invoice to get started"
              actionLabel="Create Invoice"
              onAction={() => setCreateDrawer(true)}
            />
          ),
        }}
      />

      {/* Create Invoice Drawer */}
      <Drawer
        title="Create Invoice"
        open={createDrawer}
        onClose={() => {
          setCreateDrawer(false);
          setSelectedClientId(undefined);
          setSelectedEnrollmentId(undefined);
        }}
        width={600}
        destroyOnHidden
      >
        <Form form={createForm} layout="vertical" onFinish={handleCreateInvoice} initialValues={{ lineItems: [{}], currency: 'KES', type: InvoiceType.ENROLLMENT }}>
          <Form.Item name="clientId" label="Client" rules={[{ required: true, message: 'Select a client' }]}>
            <Select
              showSearch
              placeholder="Search client by name or email..."
              filterOption={false}
              onSearch={(val) => setClientSearch(val)}
              onChange={handleClientChange}
              loading={loadingClients}
              options={clientOptions}
              notFoundContent={loadingClients ? 'Loading...' : 'No clients found'}
            />
          </Form.Item>

          {/* Enrollment Selector */}
          <Form.Item name="enrollmentId" label="Link to Enrollment (Optional)">
            <Select
              allowClear
              placeholder={selectedClientId ? 'Select an enrollment...' : 'Select a client first'}
              disabled={!selectedClientId}
              options={enrollmentOptions}
              onChange={handleEnrollmentChange}
              notFoundContent={selectedClientId ? 'No approved enrollments found' : 'Select a client first'}
            />
          </Form.Item>

          {/* Enrollment Financial Info Banner */}
          {selectedEnrollmentId && invoicedAmountData && (
            <Alert
              type="info"
              showIcon
              icon={<InfoCircleOutlined />}
              className="!mb-4"
              message="Enrollment Billing Summary"
              description={
                <div className="grid grid-cols-3 gap-2 mt-1">
                  <div>
                    <Text type="secondary" className="text-xs">Agreed Amount</Text>
                    <div><Text strong>{invoicedAmountData.agreedCurrency} {invoicedAmountData.agreedAmount.toLocaleString()}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" className="text-xs">Already Invoiced</Text>
                    <div><Text>{invoicedAmountData.agreedCurrency} {invoicedAmountData.alreadyInvoiced.toLocaleString()}</Text></div>
                  </div>
                  <div>
                    <Text type="secondary" className="text-xs">Remaining</Text>
                    <div><Text type={invoicedAmountData.remaining > 0 ? 'success' : 'danger'} strong>{invoicedAmountData.agreedCurrency} {invoicedAmountData.remaining.toLocaleString()}</Text></div>
                  </div>
                </div>
              }
            />
          )}

          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="type" label="Invoice Type" rules={[{ required: true, message: 'Required' }]}>
              <Select
                options={Object.entries(InvoiceTypeLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="currency" label="Currency" rules={[{ required: true, message: 'Required' }]}>
              <Select
                disabled={!!selectedEnrollmentId}
                options={[
                  { value: 'KES', label: 'KES' },
                  { value: 'USD', label: 'USD' },
                  { value: 'GBP', label: 'GBP' },
                  { value: 'EUR', label: 'EUR' },
                ]}
              />
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
                      <Input placeholder="e.g., SPP-303 Speech & Pitch Program - Cohort 3" />
                    </Form.Item>
                    <div className="grid grid-cols-3 gap-x-3">
                      <Form.Item
                        {...restField}
                        name={[name, 'unitPrice']}
                        label="Unit Price"
                        rules={[
                          { required: true, message: 'Required' },
                          ...(selectedEnrollmentId && invoicedAmountData && name === 0
                            ? [{
                                type: 'number' as const,
                                max: invoicedAmountData.remaining,
                                message: `Max ${invoicedAmountData.remaining.toLocaleString()}`,
                              }]
                            : []),
                        ]}
                        className="!mb-0"
                      >
                        <InputNumber
                          min={0}
                          max={selectedEnrollmentId && invoicedAmountData && name === 0 ? invoicedAmountData.remaining : undefined}
                          step={0.01}
                          className="w-full"
                          placeholder="0.00"
                        />
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
                            className="mb-0"
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

          <Form.Item name="dueDate" label="Due Date" rules={[{ required: true, message: 'Required' }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => {
              setCreateDrawer(false);
              setSelectedClientId(undefined);
              setSelectedEnrollmentId(undefined);
            }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createInvoice.isPending}>
              Create Invoice
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Record Payment Drawer */}
      <Drawer
        title="Record Payment"
        open={paymentDrawer.open}
        onClose={() => setPaymentDrawer({ open: false, invoiceId: '' })}
        width={420}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleRecordPayment}>
          <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={0} className="w-full" placeholder="Enter amount" />
          </Form.Item>
          <Form.Item name="currency" label="Currency" initialValue="KES">
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
            <Button onClick={() => setPaymentDrawer({ open: false, invoiceId: '' })}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={recordPayment.isPending}>
              Record Payment
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Edit Invoice Drawer */}
      <Drawer
        title="Edit Invoice"
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingInvoice(null); }}
        width={600}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
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
                      <Input placeholder="e.g., SPP-303 Speech & Pitch Program - Cohort 3" />
                    </Form.Item>
                    <div className="grid grid-cols-3 gap-x-3">
                      <Form.Item
                        {...restField}
                        name={[name, 'unitPrice']}
                        label="Unit Price"
                        rules={[{ required: true, message: 'Required' }]}
                        className="!mb-0"
                      >
                        <InputNumber min={0} step={0.01} className="w-full" placeholder="0.00" />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'quantity']}
                        label="Quantity"
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
                            className="mb-0"
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

          <Form.Item name="dueDate" label="Due Date" rules={[{ required: true, message: 'Required' }]}>
            <DatePicker className="w-full" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={2} placeholder="Additional notes..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => { setEditDrawerOpen(false); setEditingInvoice(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateInvoice.isPending}>
              Update Invoice
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Void Modal */}
      <Modal
        title="Void Invoice"
        open={voidModal.open}
        onCancel={() => { setVoidModal({ open: false, invoiceId: '' }); setVoidReason(''); }}
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
