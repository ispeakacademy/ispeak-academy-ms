'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import StatusTag from '@/components/admin/StatusTag';
import {
  useAddInteraction,
  useAssignClient,
  useClient,
  useClientEnrollments,
  useClientInteractions,
  useClientInvoices,
  useClientTimeline,
  useSendPortalInvite,
  useUpdateClient,
} from '@/hooks/useClients';
import { useCohorts } from '@/hooks/useCohorts';
import { useEmployees } from '@/hooks/useEmployees';
import { useCreateEnrollment } from '@/hooks/useEnrollments';
import { usePrograms } from '@/hooks/usePrograms';
import { useAuth } from '@/contexts/AuthContext';
import { CLIENTS_QUERY_KEYS } from '@/hooks/useClients';
import {
  ClientSegment,
  ClientSegmentLabels,
  ClientStatus,
  ClientStatusLabels,
  ClientType,
  ClientTypeLabels,
  CohortStatus,
  CohortStatusLabels,
  InteractionDirectionLabels,
  InteractionTypeLabels,
  LeadSource,
  LeadSourceLabels,
  InteractionType,
  InteractionDirection,
} from '@/types/enums';
import type { CreateInteractionDto } from '@/types/clients';
import type { CreateEnrollmentDto } from '@/types/enrollments';
import {
  CalendarOutlined,
  DollarOutlined,
  EditOutlined,
  FileTextOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Avatar, Button, Card, Checkbox, Descriptions, Drawer, Form, Input, InputNumber, Select, Skeleton, Space, Switch, Table, Tabs, Tag, Timeline, Typography } from 'antd';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

const { Text, Title } = Typography;

const CURRENCY_OPTIONS = [
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'EUR', label: 'EUR — Euro' },
];

export default function ClientDetailPage() {
  const params = useParams();
  const clientId = params.id as string;
  const queryClient = useQueryClient();

  const { data: client, isLoading } = useClient(clientId);
  const [activeTab, setActiveTab] = useState('overview');
  const [interactionDrawer, setInteractionDrawer] = useState(false);
  const [enrollmentDrawer, setEnrollmentDrawer] = useState(false);
  const [editDrawer, setEditDrawer] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>();
  const [form] = Form.useForm();
  const [enrollmentForm] = Form.useForm();
  const [editForm] = Form.useForm();
  const updateClient = useUpdateClient();
  const assignClient = useAssignClient();
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.userRole?.isAdminRole;

  // Employees for trainer assignment
  const { data: employeesData } = useEmployees({ limit: 100 });
  const employeeOptions = useMemo(() => {
    const employees = employeesData?.data || [];
    return employees.map((e) => ({
      value: e.employeeId,
      label: `${e.firstName} ${e.lastName} (${e.role})`,
    }));
  }, [employeesData]);

  // Lazy-load tab data
  const { data: timeline, isLoading: loadingTimeline } = useClientTimeline(clientId, activeTab === 'timeline');
  const { data: interactions, isLoading: loadingInteractions } = useClientInteractions(clientId, activeTab === 'interactions');
  const { data: enrollments, isLoading: loadingEnrollments } = useClientEnrollments(clientId, activeTab === 'enrollments');
  const { data: invoices, isLoading: loadingInvoices } = useClientInvoices(clientId, activeTab === 'invoices');
  const addInteraction = useAddInteraction();
  const createEnrollment = useCreateEnrollment();
  const sendPortalInvite = useSendPortalInvite();

  // Data for enrollment drawer
  const { data: programsData } = usePrograms({ isActive: true, limit: 100 });
  const { data: cohortsData } = useCohorts(selectedProgramId ? { programId: selectedProgramId, limit: 100 } : undefined);

  const programOptions = useMemo(() => {
    const programs = programsData?.data || [];
    return programs.map((p) => ({
      value: p.programId,
      label: `${p.name} (${p.code})`,
    }));
  }, [programsData]);

  const cohortOptions = useMemo(() => {
    const cohorts = cohortsData?.data || [];
    return cohorts.map((c) => {
      const isFull = c.status === CohortStatus.FULL || c.currentEnrollment >= c.maxCapacity;
      return {
        value: c.cohortId,
        label: `${c.name} — ${c.currentEnrollment}/${c.maxCapacity}`,
        disabled: isFull,
        status: c.status as string,
      };
    });
  }, [cohortsData]);

  const handleAddInteraction = async (values: CreateInteractionDto) => {
    await addInteraction.mutateAsync({ clientId, data: values });
    setInteractionDrawer(false);
    form.resetFields();
  };

  const handleCreateEnrollment = async (values: any) => {
    const dto: CreateEnrollmentDto = {
      clientId,
      programId: values.programId,
      agreedAmount: values.agreedAmount,
      agreedCurrency: values.agreedCurrency,
      cohortId: values.cohortId || undefined,
      discountCode: values.discountCode || undefined,
      discountPercent: values.discountPercent || undefined,
    };
    await createEnrollment.mutateAsync(dto);
    setEnrollmentDrawer(false);
    enrollmentForm.resetFields();
    setSelectedProgramId(undefined);
    queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEYS.enrollments(clientId) });
  };

  const handleEnrollmentProgramChange = (programId: string) => {
    setSelectedProgramId(programId);
    enrollmentForm.setFieldValue('cohortId', undefined);
  };

  const handleEnrollmentDrawerClose = () => {
    setEnrollmentDrawer(false);
    enrollmentForm.resetFields();
    setSelectedProgramId(undefined);
  };

  const openEditDrawer = () => {
    if (client) {
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
    }
    setEditDrawer(true);
  };

  const handleEditClient = async (values: any) => {
    await updateClient.mutateAsync({ id: clientId, data: values });
    setEditDrawer(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!client) {
    return <EmptyState title="Client not found" description="The client you're looking for doesn't exist" />;
  }

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Type" value={ClientTypeLabels[client.clientType] || client.clientType} />
            <StatCard label="Source" value={LeadSourceLabels[client.leadSource] || client.leadSource} />
            <StatCard label="Location" value={[client.city, client.county, client.country].filter(Boolean).join(', ') || 'Not specified'} />
          </div>
          <Card title="Client Information" size="small">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Email">{client.email || '-'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{client.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Alternate Phone">{client.alternatePhone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Currency">{client.preferredCurrency || '-'}</Descriptions.Item>
              <Descriptions.Item label="Corporate">{client.isCorporate ? 'Yes' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Referral Code">{client.referralCode || '-'}</Descriptions.Item>
              <Descriptions.Item label="GDPR Consent">{client.gdprConsent ? 'Yes' : 'No'}</Descriptions.Item>
              <Descriptions.Item label="Marketing Opt-in">{client.marketingOptIn ? 'Yes' : 'No'}</Descriptions.Item>
            </Descriptions>
          </Card>
          {client.notes && (
            <Card title="Notes" size="small">
              <Text>{client.notes}</Text>
            </Card>
          )}
          {client.tags && client.tags.length > 0 && (
            <Card title="Tags" size="small">
              <div className="flex flex-wrap gap-1">
                {client.tags.map((tag) => (
                  <Tag key={tag}>{tag}</Tag>
                ))}
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'timeline',
      label: 'Timeline',
      children: loadingTimeline ? (
        <Skeleton active paragraph={{ rows: 6 }} />
      ) : timeline && timeline.length > 0 ? (
        <Timeline
          items={timeline.map((item: any) => ({
            children: (
              <div>
                <Text className="text-sm">{item.description || item.summary}</Text>
                <br />
                <Text type="secondary" className="text-xs">
                  {new Date(item.createdAt || item.timestamp).toLocaleString()}
                </Text>
              </div>
            ),
          }))}
        />
      ) : (
        <EmptyState title="No timeline events" description="Activity will appear here as the client interacts with your organization" />
      ),
    },
    {
      key: 'enrollments',
      label: 'Enrollments',
      children: (
        <Table
          dataSource={enrollments?.data || []}
          loading={loadingEnrollments}
          rowKey="enrollmentId"
          size="small"
          scroll={{ x: true }}
          pagination={false}
          columns={[
            { title: 'Program', dataIndex: ['program', 'name'], key: 'program' },
            { title: 'Cohort', dataIndex: ['cohort', 'name'], key: 'cohort' },
            {
              title: 'Status', dataIndex: 'status', key: 'status',
              render: (s: string) => <StatusTag type="enrollment" status={s} />,
            },
            {
              title: 'Progress', dataIndex: 'progressPercent', key: 'progress',
              render: (p: number) => `${p}%`,
            },
          ]}
          locale={{ emptyText: <EmptyState title="No enrollments" description="This client has no enrollments" /> }}
        />
      ),
    },
    {
      key: 'invoices',
      label: 'Invoices',
      children: (
        <Table
          dataSource={invoices?.data || []}
          loading={loadingInvoices}
          rowKey="invoiceId"
          size="small"
          scroll={{ x: true }}
          pagination={false}
          columns={[
            { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
            {
              title: 'Amount', key: 'amount',
              render: (_: any, r: any) => `${r.currency} ${Number(r.totalAmount).toLocaleString()}`,
            },
            {
              title: 'Balance', key: 'balance',
              render: (_: any, r: any) => `${r.currency} ${Number(r.balance).toLocaleString()}`,
            },
            {
              title: 'Status', dataIndex: 'status', key: 'status',
              render: (s: string) => <StatusTag type="invoice" status={s} />,
            },
            {
              title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate',
              render: (d: string) => new Date(d).toLocaleDateString(),
            },
          ]}
          locale={{ emptyText: <EmptyState title="No invoices" description="This client has no invoices" /> }}
        />
      ),
    },
    {
      key: 'interactions',
      label: 'Interactions',
      children: (
        <div>
          <div className="flex justify-end mb-4">
            <Button size="small" icon={<PlusOutlined />} onClick={() => setInteractionDrawer(true)}>
              Log Interaction
            </Button>
          </div>
          <Table
            dataSource={interactions?.data || []}
            loading={loadingInteractions}
            rowKey="interactionId"
            size="small"
            scroll={{ x: true }}
            pagination={false}
            columns={[
              {
                title: 'Type', dataIndex: 'type', key: 'type',
                render: (t: InteractionType) => InteractionTypeLabels[t] || t,
              },
              {
                title: 'Direction', dataIndex: 'direction', key: 'direction',
                render: (d: InteractionDirection) => InteractionDirectionLabels[d] || d,
              },
              { title: 'Summary', dataIndex: 'summary', key: 'summary', ellipsis: true },
              {
                title: 'Date', dataIndex: 'createdAt', key: 'createdAt',
                render: (d: string) => new Date(d).toLocaleDateString(),
              },
            ]}
            locale={{ emptyText: <EmptyState title="No interactions" description="Log your first interaction with this client" actionLabel="Log Interaction" onAction={() => setInteractionDrawer(true)} /> }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`${client.firstName} ${client.lastName}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Clients', href: '/admin/clients' },
          { label: `${client.firstName} ${client.lastName}` },
        ]}
        actions={
          <Space>
            <Button icon={<EditOutlined />} onClick={openEditDrawer}>
              Edit
            </Button>
            <Button icon={<PlusOutlined />} onClick={() => setInteractionDrawer(true)}>
              Log Interaction
            </Button>
            {client.email && (
              <Button
                icon={<MailOutlined />}
                loading={sendPortalInvite.isPending}
                onClick={() => sendPortalInvite.mutate(clientId)}
              >
                Send Portal Invite
              </Button>
            )}
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setEnrollmentDrawer(true)}>
              Enroll Client
            </Button>
          </Space>
        }
      />

      {/* Client Header Card */}
      <Card size="small" className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar size={64} icon={<UserOutlined />} className="bg-blue-600" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Title level={5} className="!mb-0">
                {client.firstName} {client.lastName}
              </Title>
              <StatusTag type="client" status={client.status} />
            </div>
            <div className="flex flex-wrap gap-4 mt-1">
              {client.email && (
                <Text type="secondary" className="text-sm flex items-center gap-1">
                  <MailOutlined /> {client.email}
                </Text>
              )}
              {client.phone && (
                <Text type="secondary" className="text-sm flex items-center gap-1">
                  <PhoneOutlined /> {client.phone}
                </Text>
              )}
            </div>
          </div>
          {isAdmin && (
            <div className="flex items-center gap-2 ml-auto shrink-0">
              <Text type="secondary" className="text-sm">Assigned to:</Text>
              <Select
                style={{ width: 220 }}
                placeholder="Select trainer"
                value={client.assignedToEmployeeId || undefined}
                options={employeeOptions}
                onChange={(employeeId) => assignClient.mutate({ clientId, employeeId })}
                loading={assignClient.isPending}
                allowClear
                onClear={() => assignClient.mutate({ clientId, employeeId: '' })}
                showSearch
                filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                size="small"
              />
            </div>
          )}
        </div>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="admin-tabs"
      />

      {/* Add Interaction Drawer */}
      <Drawer
        title="Log Interaction"
        open={interactionDrawer}
        onClose={() => setInteractionDrawer(false)}
        width={420}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleAddInteraction}>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select type"
              options={Object.entries(InteractionTypeLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="direction" label="Direction" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select direction"
              options={Object.entries(InteractionDirectionLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="summary" label="Summary" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea rows={4} placeholder="What was discussed?" />
          </Form.Item>
          <Form.Item name="outcome" label="Outcome">
            <Input.TextArea rows={2} placeholder="What was the result?" />
          </Form.Item>
          <Form.Item name="followUpDate" label="Follow-up Date">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="followUpNote" label="Follow-up Note">
            <Input placeholder="What needs to happen next?" />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setInteractionDrawer(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={addInteraction.isPending}>
              Log Interaction
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Enroll Client Drawer */}
      <Drawer
        title={`Enroll ${client.firstName} ${client.lastName}`}
        open={enrollmentDrawer}
        onClose={handleEnrollmentDrawerClose}
        width={480}
        destroyOnHidden
      >
        <Form form={enrollmentForm} layout="vertical" onFinish={handleCreateEnrollment}>
          <Form.Item name="programId" label="Program" rules={[{ required: true, message: 'Please select a program' }]}>
            <Select
              placeholder="Select program"
              options={programOptions}
              onChange={handleEnrollmentProgramChange}
              showSearch
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          </Form.Item>

          <Form.Item name="cohortId" label="Cohort (optional)">
            <Select
              placeholder={selectedProgramId ? 'Select cohort (optional)' : 'Select a program first'}
              disabled={!selectedProgramId}
              allowClear
              options={cohortOptions}
              optionRender={(option) => (
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {option.data.disabled && <Tag color="warning" className="ml-2">Full</Tag>}
                  {!option.data.disabled && option.data.status && (
                    <Tag color={option.data.status === CohortStatus.OPEN ? 'success' : 'default'} className="ml-2">
                      {CohortStatusLabels[option.data.status as CohortStatus] || option.data.status}
                    </Tag>
                  )}
                </div>
              )}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="agreedAmount" label="Agreed Amount" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} className="!w-full" placeholder="0" />
            </Form.Item>

            <Form.Item name="agreedCurrency" label="Currency" rules={[{ required: true, message: 'Required' }]} initialValue="KES">
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="discountCode" label="Discount Code">
              <Input placeholder="e.g. EARLY2025" />
            </Form.Item>

            <Form.Item name="discountPercent" label="Discount %">
              <InputNumber min={0} max={100} className="!w-full" placeholder="0" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleEnrollmentDrawerClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createEnrollment.isPending}>
              Create Enrollment
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Edit Client Drawer */}
      <Drawer
        title="Edit Client"
        open={editDrawer}
        onClose={() => setEditDrawer(false)}
        width={520}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditClient}>
          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="firstName" label="First Name" rules={[{ required: true, message: 'Required' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="lastName" label="Last Name" rules={[{ required: true, message: 'Required' }]}>
              <Input />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="email" label="Email">
              <Input type="email" />
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
              <Select
                options={Object.entries(ClientTypeLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="segment" label="Segment">
              <Select
                allowClear
                placeholder="Select segment"
                options={Object.entries(ClientSegmentLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Required' }]}>
              <Select
                options={Object.entries(ClientStatusLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="leadSource" label="Lead Source">
              <Select
                allowClear
                placeholder="Select source"
                options={Object.entries(LeadSourceLabels).map(([value, label]) => ({ value, label }))}
              />
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
              <Select allowClear placeholder="Select" options={CURRENCY_OPTIONS} />
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
            <Button onClick={() => setEditDrawer(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateClient.isPending}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
