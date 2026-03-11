'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import StatusTag from '@/components/admin/StatusTag';
import { useInitiateMpesaPayment, useMyInvoices } from '@/hooks/usePortal';
import { useSettings } from '@/hooks/useSettings';
import { generateReceiptPDF } from '@/lib/generate-receipt-pdf';
import { getMyInvoicePayments } from '@/lib/api/portal.api';
import { generateInvoicePDF } from '@/lib/generate-invoice-pdf';
import type { Invoice } from '@/types/invoices';
import { InvoiceStatus, InvoiceStatusLabels } from '@/types/enums';
import {
  DollarOutlined,
  DownloadOutlined,
  FileDoneOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { Button, Card, Form, Input, InputNumber, Modal, Statistic, Table, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';

const { Text } = Typography;

export default function PortalInvoicesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMyInvoices(page, 20);
  const [mpesaModal, setMpesaModal] = useState<{ open: boolean; invoice: Invoice | null }>({ open: false, invoice: null });
  const [form] = Form.useForm();
  const initiateMpesa = useInitiateMpesaPayment();
  const { data: settings } = useSettings();
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

  const handleDownloadReceipt = async (invoice: Invoice) => {
    setReceiptLoadingId(invoice.invoiceId);
    try {
      const result = await getMyInvoicePayments(invoice.invoiceId);
      const payments = result?.payments || (Array.isArray(result) ? result : []);
      await generateReceiptPDF(invoice, payments, settings || null);
    } catch (err) {
      console.error('Failed to generate receipt:', err);
    } finally {
      setReceiptLoadingId(null);
    }
  };

  const handleDownloadInvoicePDF = async (invoice: Invoice) => {
    setPdfLoadingId(invoice.invoiceId);
    try {
      await generateInvoicePDF(invoice, settings || null);
    } catch (err) {
      console.error('Failed to generate invoice PDF:', err);
    } finally {
      setPdfLoadingId(null);
    }
  };

  const invoices = data?.data || [];

  const stats = useMemo(() => {
    const outstanding = invoices
      .filter((inv) => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.VOID)
      .reduce((sum, inv) => sum + Number(inv.balance || 0), 0);
    const paid = invoices
      .filter((inv) => inv.status === InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0);
    return { outstanding, paid };
  }, [invoices]);

  const handleMpesaPay = async (values: { phoneNumber: string; amount: number }) => {
    if (!mpesaModal.invoice) return;
    await initiateMpesa.mutateAsync({
      invoiceId: mpesaModal.invoice.invoiceId,
      phoneNumber: values.phoneNumber,
      amount: values.amount,
    });
    setMpesaModal({ open: false, invoice: null });
    form.resetFields();
  };

  const columns: ColumnsType<Invoice> = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
      render: (num: string) => <Text strong>{num}</Text>,
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
      responsive: ['md'],
      render: (d: string) => {
        const date = new Date(d);
        const isOverdue = date < new Date();
        return (
          <Text type={isOverdue ? 'danger' : undefined}>
            {date.toLocaleDateString()}
          </Text>
        );
      },
    },
    {
      title: '',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <div className="flex gap-1">
          <Tooltip title="Download Invoice">
            <Button
              size="small"
              icon={<DownloadOutlined />}
              onClick={() => handleDownloadInvoicePDF(record)}
              loading={pdfLoadingId === record.invoiceId}
            />
          </Tooltip>
          {Number(record.amountPaid) > 0 && (
            <Tooltip title="Download Receipt">
              <Button
                size="small"
                icon={<FileDoneOutlined />}
                onClick={() => handleDownloadReceipt(record)}
                loading={receiptLoadingId === record.invoiceId}
              />
            </Tooltip>
          )}
          {record.status !== InvoiceStatus.PAID && record.status !== InvoiceStatus.VOID && (
            <Button
              type="primary"
              size="small"
              icon={<PhoneOutlined />}
              onClick={() => {
                setMpesaModal({ open: true, invoice: record });
                form.setFieldsValue({ amount: Number(record.balance) });
              }}
            >
              Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="My Invoices"
        subtitle="View and pay your invoices"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Card size="small">
          <Statistic
            title="Outstanding Balance"
            value={stats.outstanding}
            prefix="KES"
            valueStyle={stats.outstanding > 0 ? { color: '#f5222d' } : { color: '#52c41a' }}
          />
        </Card>
        <Card size="small">
          <Statistic
            title="Total Paid"
            value={stats.paid}
            prefix="KES"
            valueStyle={{ color: '#52c41a' }}
          />
        </Card>
      </div>

      <Table
        dataSource={invoices}
        columns={columns}
        loading={isLoading}
        rowKey="invoiceId"
        size="small"
        scroll={{ x: true }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total || 0,
          showTotal: (total) => `${total} invoices`,
          onChange: setPage,
        }}
        locale={{
          emptyText: (
            <EmptyState
              icon={<DollarOutlined />}
              title="No invoices"
              description="Your invoices will appear here"
            />
          ),
        }}
      />

      {/* M-Pesa Payment Modal */}
      <Modal
        title="Pay with M-Pesa"
        open={mpesaModal.open}
        onCancel={() => { setMpesaModal({ open: false, invoice: null }); form.resetFields(); }}
        footer={null}
        destroyOnHidden
      >
        {mpesaModal.invoice && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex justify-between">
              <Text type="secondary">Invoice</Text>
              <Text strong>{mpesaModal.invoice.invoiceNumber}</Text>
            </div>
            <div className="flex justify-between mt-1">
              <Text type="secondary">Balance Due</Text>
              <Text strong type="danger">
                {mpesaModal.invoice.currency} {Number(mpesaModal.invoice.balance).toLocaleString()}
              </Text>
            </div>
          </div>
        )}
        <Form form={form} layout="vertical" onFinish={handleMpesaPay}>
          <Form.Item
            name="phoneNumber"
            label="M-Pesa Phone Number"
            rules={[
              { required: true, message: 'Phone number is required' },
              { pattern: /^254\d{9}$/, message: 'Enter number in format: 254XXXXXXXXX' },
            ]}
          >
            <Input
              placeholder="254712345678"
              prefix={<PhoneOutlined />}
              maxLength={12}
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount (KES)"
            rules={[{ required: true, message: 'Amount is required' }]}
          >
            <InputNumber min={1} className="w-full" />
          </Form.Item>
          <Text type="secondary" className="text-xs block mb-4">
            You will receive an M-Pesa prompt on your phone. Enter your PIN to complete the payment.
          </Text>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setMpesaModal({ open: false, invoice: null }); form.resetFields(); }}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" loading={initiateMpesa.isPending}>
              Send Payment Request
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
