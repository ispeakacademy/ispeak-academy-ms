'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import StatusTag from '@/components/admin/StatusTag';
import {
  useAddAvailabilityBlock,
  useAvailabilityBlocks,
  useDeactivateEmployee,
  useDeleteAvailabilityBlock,
  useEmployee,
  useEmployeeCohorts,
  useEmployeeSessions,
  useEmployeeWorkload,
  useRoles,
  useUpdateEmployee,
  useUpdateEmployeeRole,
} from '@/hooks/useEmployees';
import type { CreateAvailabilityBlockDto, UpdateEmployeeDto } from '@/types/employees';
import {
  BlockType,
  BlockTypeLabels,
  EmployeeRoleLabels,
  EmploymentTypeLabels,
} from '@/types/enums';

const DAYS_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  StopOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Skeleton,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

const { Text, Title } = Typography;

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  const { data: employee, isLoading } = useEmployee(employeeId);
  const [activeTab, setActiveTab] = useState('overview');
  const [blockDrawer, setBlockDrawer] = useState(false);
  const [editDrawer, setEditDrawer] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  // Lazy-load tab data
  const { data: sessions, isLoading: loadingSessions } = useEmployeeSessions(employeeId, activeTab === 'sessions');
  const { data: cohorts, isLoading: loadingCohorts } = useEmployeeCohorts(employeeId, activeTab === 'cohorts');
  const { data: workload, isLoading: loadingWorkload } = useEmployeeWorkload(employeeId, undefined, activeTab === 'workload');
  const { data: blocks, isLoading: loadingBlocks } = useAvailabilityBlocks(employeeId, activeTab === 'availability');

  const updateEmployee = useUpdateEmployee();
  const updateEmployeeRole = useUpdateEmployeeRole();
  const deactivateEmployee = useDeactivateEmployee();
  const addBlock = useAddAvailabilityBlock();
  const deleteBlock = useDeleteAvailabilityBlock();
  const { data: roles } = useRoles();

  const handleAddBlock = async (values: CreateAvailabilityBlockDto) => {
    await addBlock.mutateAsync({ employeeId, data: values });
    setBlockDrawer(false);
    form.resetFields();
  };

  const handleEdit = async (values: UpdateEmployeeDto) => {
    await updateEmployee.mutateAsync({ id: employeeId, data: values });
    setEditDrawer(false);
    editForm.resetFields();
  };

  const handleDeactivate = async () => {
    await deactivateEmployee.mutateAsync(employeeId);
  };

  const roleOptions = useMemo(() => {
    if (!roles) return [];
    return roles
      .filter((r: any) => r.isAdminRole)
      .map((r: any) => ({ value: r.roleId, label: r.name }));
  }, [roles]);

  const currentSystemRole = employee?.user?.userRole?.name || employee?.user?.roleId;
  const currentSystemRoleId = employee?.user?.roleId;

  const handleRoleChange = async (roleId: string) => {
    await updateEmployeeRole.mutateAsync({ employeeId, roleId });
  };

  const openEditDrawer = () => {
    if (employee) {
      editForm.setFieldsValue({
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        phone: employee.phone,
        role: employee.role,
        employmentType: employee.employmentType,
        specialization: employee.specialization,
        hourlyRate: employee.hourlyRate,
        rateCurrency: employee.rateCurrency,
        availableDays: employee.availableDays,
        certifications: employee.certifications,
        bio: employee.bio,
      });
    }
    setEditDrawer(true);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (!employee) {
    return <EmptyState title="Employee not found" description="The employee you're looking for doesn't exist" />;
  }

  const tabItems = [
    {
      key: 'overview',
      label: 'Overview',
      children: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Role" value={EmployeeRoleLabels[employee.role] || employee.role} />
            <StatCard label="Employment" value={EmploymentTypeLabels[employee.employmentType] || employee.employmentType} />
            <StatCard
              label="Rate"
              value={employee.hourlyRate ? `${employee.rateCurrency || ''} ${Number(employee.hourlyRate).toLocaleString()}/hr` : 'Not set'}
            />
          </div>
          <Card title="Employee Information" size="small">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Email">{employee.email}</Descriptions.Item>
              <Descriptions.Item label="Phone">{employee.phone || '-'}</Descriptions.Item>
              <Descriptions.Item label="Specialization">{employee.specialization || '-'}</Descriptions.Item>
              <Descriptions.Item label="Start Date">
                {employee.startDate ? new Date(employee.startDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="End Date">
                {employee.endDate ? new Date(employee.endDate).toLocaleDateString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="Available Days">
                {employee.availableDays?.length > 0
                  ? employee.availableDays.map((d) => <Tag key={d} className="capitalize">{d}</Tag>)
                  : '-'}
              </Descriptions.Item>
              {employee.availableHours && (
                <Descriptions.Item label="Available Hours">
                  {employee.availableHours.start} - {employee.availableHours.end}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>
          {employee.bio && (
            <Card title="Bio" size="small">
              <Text>{employee.bio}</Text>
            </Card>
          )}
          {employee.certifications && employee.certifications.length > 0 && (
            <Card title="Certifications" size="small">
              <div className="flex flex-wrap gap-1">
                {employee.certifications.map((cert) => (
                  <Tag key={cert}>{cert}</Tag>
                ))}
              </div>
            </Card>
          )}
        </div>
      ),
    },
    {
      key: 'sessions',
      label: 'Sessions',
      children: (
        <Table
          dataSource={sessions?.data || []}
          loading={loadingSessions}
          rowKey="sessionId"
          size="small"
          scroll={{ x: true }}
          pagination={false}
          columns={[
            { title: 'Title', dataIndex: 'title', key: 'title' },
            {
              title: 'Cohort', key: 'cohort',
              render: (_: any, r: any) => r.cohort?.name || '-',
            },
            {
              title: 'Scheduled', dataIndex: 'scheduledAt', key: 'scheduledAt',
              render: (d: string) => new Date(d).toLocaleString(),
            },
            {
              title: 'Duration', dataIndex: 'durationMinutes', key: 'duration',
              render: (m: number) => `${m} min`,
            },
            {
              title: 'Status', dataIndex: 'status', key: 'status',
              render: (s: string) => <StatusTag type="session" status={s} />,
            },
          ]}
          locale={{ emptyText: <EmptyState title="No sessions" description="No sessions assigned to this employee" /> }}
        />
      ),
    },
    {
      key: 'cohorts',
      label: 'Cohorts',
      children: (
        <Table
          dataSource={cohorts || []}
          loading={loadingCohorts}
          rowKey="cohortId"
          size="small"
          scroll={{ x: true }}
          pagination={false}
          columns={[
            { title: 'Name', dataIndex: 'name', key: 'name' },
            { title: 'Batch Code', dataIndex: 'batchCode', key: 'batchCode' },
            {
              title: 'Program', key: 'program',
              render: (_: any, r: any) => r.program?.name || '-',
            },
            {
              title: 'Start', dataIndex: 'startDate', key: 'startDate',
              render: (d: string) => new Date(d).toLocaleDateString(),
            },
            {
              title: 'Status', dataIndex: 'status', key: 'status',
              render: (s: string) => <StatusTag type="cohort" status={s} />,
            },
          ]}
          locale={{ emptyText: <EmptyState title="No cohorts" description="No cohorts assigned to this employee" /> }}
        />
      ),
    },
    {
      key: 'workload',
      label: 'Workload',
      children: loadingWorkload ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : workload ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Sessions" value={workload.sessionsCount} icon={<CalendarOutlined />} />
          <StatCard label="Total Hours" value={workload.totalHours} icon={<ClockCircleOutlined />} />
          <StatCard label="Completed" value={workload.completedSessions} />
          <StatCard label="Upcoming" value={workload.upcomingSessions} />
        </div>
      ) : (
        <EmptyState title="No workload data" description="Workload data will appear when sessions are assigned" />
      ),
    },
    {
      key: 'availability',
      label: 'Availability',
      children: (
        <div>
          <div className="flex justify-end mb-4">
            <Button size="small" icon={<PlusOutlined />} onClick={() => setBlockDrawer(true)}>
              Add Block
            </Button>
          </div>
          <Table
            dataSource={blocks || []}
            loading={loadingBlocks}
            rowKey="blockId"
            size="small"
            scroll={{ x: true }}
            pagination={false}
            columns={[
              {
                title: 'Type', dataIndex: 'type', key: 'type',
                render: (t: BlockType) => <Tag>{BlockTypeLabels[t] || t}</Tag>,
              },
              {
                title: 'Start', dataIndex: 'startDate', key: 'startDate',
                render: (d: string) => new Date(d).toLocaleDateString(),
              },
              {
                title: 'End', dataIndex: 'endDate', key: 'endDate',
                render: (d: string) => new Date(d).toLocaleDateString(),
              },
              {
                title: 'Reason', dataIndex: 'reason', key: 'reason',
                render: (r: string) => r || <Text type="secondary">-</Text>,
              },
              {
                title: '', key: 'actions', width: 60,
                render: (_: any, record: any) => (
                  <Popconfirm
                    title="Remove this block?"
                    onConfirm={() => deleteBlock.mutate({ employeeId, blockId: record.blockId })}
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                ),
              },
            ]}
            locale={{
              emptyText: (
                <EmptyState
                  title="No availability blocks"
                  description="Add blocks to mark periods when this employee is unavailable"
                  actionLabel="Add Block"
                  onAction={() => setBlockDrawer(true)}
                />
              ),
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={`${employee.firstName} ${employee.lastName}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Employees', href: '/admin/employees' },
          { label: `${employee.firstName} ${employee.lastName}` },
        ]}
        actions={
          <div className="flex gap-2">
            <Button icon={<EditOutlined />} onClick={openEditDrawer}>
              Edit
            </Button>
            {employee.status !== 'inactive' && (
              <Popconfirm title="Deactivate this employee?" onConfirm={handleDeactivate}>
                <Button danger icon={<StopOutlined />}>
                  Deactivate
                </Button>
              </Popconfirm>
            )}
          </div>
        }
      />

      {/* Employee Header Card */}
      <Card size="small" className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar size={64} icon={<UserOutlined />} className="bg-blue-600" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Title level={5} className="!mb-0">
                {employee.firstName} {employee.lastName}
              </Title>
              <StatusTag type="employee" status={employee.status} />
              <Tag>{EmployeeRoleLabels[employee.role] || employee.role}</Tag>
              {currentSystemRole && (
                <Tag color="blue">System: {currentSystemRole}</Tag>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Text type="secondary" className="text-xs">System Role:</Text>
              <Select
                size="small"
                value={currentSystemRoleId}
                onChange={handleRoleChange}
                loading={updateEmployeeRole.isPending || !roles}
                options={roleOptions}
                style={{ width: 160 }}
                placeholder="Select role"
              />
            </div>
            <div className="flex flex-wrap gap-4 mt-1">
              <Text type="secondary" className="text-sm flex items-center gap-1">
                <MailOutlined /> {employee.email}
              </Text>
              {employee.phone && (
                <Text type="secondary" className="text-sm flex items-center gap-1">
                  <PhoneOutlined /> {employee.phone}
                </Text>
              )}
              {employee.specialization && (
                <Text type="secondary" className="text-sm">
                  {employee.specialization}
                </Text>
              )}
            </div>
          </div>
        </div>
      </Card>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="admin-tabs"
      />

      {/* Add Availability Block Drawer */}
      <Drawer
        title="Add Availability Block"
        open={blockDrawer}
        onClose={() => setBlockDrawer(false)}
        width={420}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleAddBlock}>
          <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select type"
              options={Object.entries(BlockTypeLabels).map(([value, label]) => ({ value, label }))}
            />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: 'Required' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="endDate" label="End Date" rules={[{ required: true, message: 'Required' }]}>
            <Input type="date" />
          </Form.Item>
          <Form.Item name="reason" label="Reason">
            <Input.TextArea rows={3} placeholder="Reason for unavailability..." />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setBlockDrawer(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={addBlock.isPending}>
              Add Block
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Edit Employee Drawer */}
      <Drawer
        title="Edit Employee"
        open={editDrawer}
        onClose={() => setEditDrawer(false)}
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

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="role" label="Role" rules={[{ required: true, message: 'Required' }]}>
              <Select options={Object.entries(EmployeeRoleLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true, message: 'Required' }]}>
              <Select options={Object.entries(EmploymentTypeLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
          </div>

          <Form.Item name="specialization" label="Specialization">
            <Input placeholder="e.g., Public Speaking, Leadership" />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="hourlyRate" label="Hourly Rate">
              <InputNumber className="!w-full" placeholder="0.00" min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="rateCurrency" label="Currency">
              <Select
                allowClear
                placeholder="Currency"
                options={[
                  { value: 'KES', label: 'KES' },
                  { value: 'USD', label: 'USD' },
                  { value: 'GBP', label: 'GBP' },
                  { value: 'EUR', label: 'EUR' },
                ]}
              />
            </Form.Item>
          </div>

          <Form.Item name="availableDays" label="Available Days">
            <Select mode="multiple" placeholder="Select days" options={DAYS_OPTIONS} />
          </Form.Item>

          <Form.Item name="certifications" label="Certifications">
            <Select mode="tags" placeholder="Type certification and press Enter" />
          </Form.Item>

          <Form.Item name="bio" label="Bio">
            <Input.TextArea rows={3} placeholder="Brief bio..." />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setEditDrawer(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateEmployee.isPending}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
