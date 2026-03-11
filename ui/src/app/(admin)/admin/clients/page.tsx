'use client';

import EmptyState from '@/components/admin/EmptyState';
import FilterBar from '@/components/admin/FilterBar';
import PageHeader from '@/components/admin/PageHeader';
import StatusTag from '@/components/admin/StatusTag';
import { useClients, useCreateClient, useUpdateClient } from '@/hooks/useClients';
import type { Client, CreateClientDto, QueryClientsDto } from '@/types/clients';
import type { ClientsResponse } from '@/lib/api/clients.api';
import {
  ClientSegmentLabels,
  ClientStatusLabels,
  ClientType,
  ClientTypeLabels,
  LeadSource,
  LeadSourceLabels,
  ClientStatus,
} from '@/types/enums';
import { DollarOutlined, PlusOutlined, EyeOutlined, EditOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Drawer, Form, Input, Select, Switch, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

const { Text } = Typography;

export default function ClientsPage() {
  const [query, setQuery] = useState<QueryClientsDto>({ page: 1, limit: 20 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data, isLoading } = useClients(query);
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();

  const handleFilterChange = useCallback((filters: Record<string, string | undefined>) => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      status: filters.status as ClientStatus | undefined,
      clientType: filters.clientType as ClientType | undefined,
      leadSource: filters.leadSource as LeadSource | undefined,
    }));
  }, []);

  const handleSearch = useCallback((search: string) => {
    setQuery((prev) => ({ ...prev, page: 1, search: search || undefined }));
  }, []);

  const handleCreate = async (values: CreateClientDto) => {
    await createClient.mutateAsync(values);
    setDrawerOpen(false);
    form.resetFields();
  };

  const openEditDrawer = (client: Client) => {
    setEditingClient(client);
    editForm.setFieldsValue({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      alternatePhone: client.alternatePhone,
      clientType: client.clientType,
      segment: client.segment,
      status: client.status,
      leadSource: client.leadSource,
      country: client.country,
      county: client.county,
      city: client.city,
      timezone: client.timezone,
      preferredCurrency: client.preferredCurrency,
      isCorporate: client.isCorporate,
      gdprConsent: client.gdprConsent,
      marketingOptIn: client.marketingOptIn,
      notes: client.notes,
      tags: client.tags,
    });
    setEditDrawerOpen(true);
  };

  const handleEdit = async (values: any) => {
    if (!editingClient) return;
    await updateClient.mutateAsync({ id: editingClient.clientId, data: values });
    setEditDrawerOpen(false);
    setEditingClient(null);
  };

  const filters = useMemo(() => [
    {
      key: 'status',
      placeholder: 'Status',
      options: Object.entries(ClientStatusLabels).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'clientType',
      placeholder: 'Client Type',
      options: Object.entries(ClientTypeLabels).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'leadSource',
      placeholder: 'Lead Source',
      options: Object.entries(LeadSourceLabels).map(([value, label]) => ({ value, label })),
    },
  ], []);

  const financials = (data as ClientsResponse | undefined)?.financials || {};

  const columns: ColumnsType<Client> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <Link href={`/admin/clients/${record.clientId}`} className="text-blue-600 hover:text-blue-800">
          <Text strong>{record.firstName} {record.lastName}</Text>
        </Link>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'],
      render: (email: string) => email || <Text type="secondary">-</Text>,
    },
    {
      title: 'Phone',
      dataIndex: 'phone',
      key: 'phone',
      responsive: ['lg'],
      render: (phone: string) => phone || <Text type="secondary">-</Text>,
    },
    {
      title: 'Type',
      dataIndex: 'clientType',
      key: 'clientType',
      responsive: ['md'],
      render: (type: ClientType) => ClientTypeLabels[type] || type,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag type="client" status={status} />,
    },
    {
      title: 'Invoiced',
      key: 'totalInvoiced',
      responsive: ['xl'],
      render: (_, record) => {
        const f = financials[record.clientId];
        return f ? `KES ${f.totalInvoiced.toLocaleString()}` : <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Paid',
      key: 'totalPaid',
      responsive: ['xl'],
      render: (_, record) => {
        const f = financials[record.clientId];
        return f ? `KES ${f.totalPaid.toLocaleString()}` : <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Outstanding',
      key: 'totalOutstanding',
      responsive: ['xl'],
      render: (_, record) => {
        const f = financials[record.clientId];
        if (!f) return <Text type="secondary">-</Text>;
        return (
          <Text type={f.totalOutstanding > 0 ? 'danger' : undefined}>
            KES {f.totalOutstanding.toLocaleString()}
          </Text>
        );
      },
    },
    {
      title: 'Source',
      dataIndex: 'leadSource',
      key: 'leadSource',
      responsive: ['xl'],
      render: (source: LeadSource) => LeadSourceLabels[source] || source,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)} />
          <Link href={`/admin/clients/${record.clientId}`}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Clients"
        subtitle="Manage your client relationships"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Clients' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            Add Client
          </Button>
        }
      />

      <FilterBar
        filters={filters}
        searchPlaceholder="Search clients..."
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      <Table
        dataSource={data?.data || []}
        columns={columns}
        loading={isLoading}
        rowKey="clientId"
        size="small"
        scroll={{ x: true }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `${total} clients`,
          onChange: (page, pageSize) => setQuery((prev) => ({ ...prev, page, limit: pageSize })),
        }}
        locale={{
          emptyText: (
            <EmptyState
              icon={<TeamOutlined />}
              title="No clients yet"
              description="Add your first client to get started"
              actionLabel="Add Client"
              onAction={() => setDrawerOpen(true)}
            />
          ),
        }}
      />

      {/* Create Client Drawer */}
      <Drawer
        title="Add New Client"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="John" />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="Doe" />
            </Form.Item>
          </div>
          <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Invalid email' }]}>
            <Input placeholder="john@example.com" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+254712345678" />
          </Form.Item>
          <Form.Item name="clientType" label="Client Type" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select type"
              options={Object.entries(ClientTypeLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="leadSource" label="Lead Source" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select source"
              options={Object.entries(LeadSourceLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="country" label="Country">
            <Input placeholder="KE" />
          </Form.Item>
          <Form.Item name="county" label="County">
            <Input placeholder="Nairobi" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createClient.isPending}>
              Create Client
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Edit Client Drawer */}
      <Drawer
        title={editingClient ? `Edit ${editingClient.firstName} ${editingClient.lastName}` : 'Edit Client'}
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingClient(null); }}
        width={520}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Invalid email' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Phone">
              <Input placeholder="+254712345678" />
            </Form.Item>
          </div>

          <Form.Item name="alternatePhone" label="Alternate Phone">
            <Input placeholder="+254712345678" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="clientType" label="Client Type" rules={[{ required: true, message: 'Required' }]}>
              <Select options={Object.entries(ClientTypeLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item name="segment" label="Segment">
              <Select allowClear placeholder="Select segment" options={Object.entries(ClientSegmentLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Required' }]}>
              <Select options={Object.entries(ClientStatusLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item name="leadSource" label="Lead Source">
              <Select allowClear placeholder="Select source" options={Object.entries(LeadSourceLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="country" label="Country">
              <Input placeholder="KE" />
            </Form.Item>
            <Form.Item name="county" label="County">
              <Input placeholder="Nairobi" />
            </Form.Item>
            <Form.Item name="city" label="City">
              <Input placeholder="Nairobi" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="timezone" label="Timezone">
              <Input placeholder="Africa/Nairobi" />
            </Form.Item>
            <Form.Item name="preferredCurrency" label="Currency">
              <Select
                allowClear
                placeholder="Select"
                options={[
                  { value: 'KES', label: 'KES' },
                  { value: 'USD', label: 'USD' },
                  { value: 'GBP', label: 'GBP' },
                  { value: 'EUR', label: 'EUR' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item name="tags" label="Tags">
            <Select mode="tags" placeholder="Type tag and press Enter" />
          </Form.Item>

          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Internal notes..." />
          </Form.Item>

          <div className="grid grid-cols-3 gap-4">
            <Form.Item name="isCorporate" label="Corporate" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="gdprConsent" label="GDPR Consent" valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item name="marketingOptIn" label="Marketing Opt-in" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => { setEditDrawerOpen(false); setEditingClient(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateClient.isPending}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
