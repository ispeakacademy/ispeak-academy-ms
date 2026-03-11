'use client';

import EmptyState from '@/components/admin/EmptyState';
import FilterBar from '@/components/admin/FilterBar';
import PageHeader from '@/components/admin/PageHeader';
import StatusTag from '@/components/admin/StatusTag';
import { useCreateEmployee, useEmployees, useRoles, useUpdateEmployee, useUpdateEmployeeRole } from '@/hooks/useEmployees';
import type { CreateEmployeeDto, Employee, QueryEmployeesDto } from '@/types/employees';
import {
  EmployeeRole,
  EmployeeRoleLabels,
  EmployeeStatus,
  EmployeeStatusLabels,
  EmploymentType,
  EmploymentTypeLabels,
} from '@/types/enums';
import { EditOutlined, EyeOutlined, PlusOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Drawer, Form, Input, InputNumber, Select, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

const { Text } = Typography;

const DAYS_OPTIONS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

export default function EmployeesPage() {
  const [query, setQuery] = useState<QueryEmployeesDto>({ page: 1, limit: 20 });
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data, isLoading } = useEmployees(query);
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const updateEmployeeRole = useUpdateEmployeeRole();
  const { data: roles } = useRoles();

  const handleFilterChange = useCallback((filters: Record<string, string | undefined>) => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      role: filters.role as EmployeeRole | undefined,
      status: filters.status as EmployeeStatus | undefined,
      employmentType: filters.employmentType as EmploymentType | undefined,
    }));
  }, []);

  const handleSearch = useCallback((search: string) => {
    setQuery((prev) => ({ ...prev, page: 1, search: search || undefined }));
  }, []);

  const handleCreate = async (values: CreateEmployeeDto) => {
    await createEmployee.mutateAsync(values);
    setDrawerOpen(false);
    form.resetFields();
  };

  const openEditDrawer = (employee: Employee) => {
    setEditingEmployee(employee);
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
      bio: employee.bio,
      certifications: employee.certifications,
      systemRoleId: employee.user?.roleId,
    });
    setEditDrawerOpen(true);
  };

  const handleEdit = async (values: any) => {
    if (!editingEmployee) return;
    const { systemRoleId, ...employeeData } = values;
    await updateEmployee.mutateAsync({ id: editingEmployee.employeeId, data: employeeData });
    // If system role changed, update it separately
    const currentRoleId = editingEmployee.user?.roleId;
    if (systemRoleId && systemRoleId !== currentRoleId) {
      await updateEmployeeRole.mutateAsync({ employeeId: editingEmployee.employeeId, roleId: systemRoleId });
    }
    setEditDrawerOpen(false);
    setEditingEmployee(null);
  };

  const filters = useMemo(() => [
    {
      key: 'role',
      placeholder: 'Role',
      options: Object.entries(EmployeeRoleLabels).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'status',
      placeholder: 'Status',
      options: Object.entries(EmployeeStatusLabels).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'employmentType',
      placeholder: 'Employment Type',
      options: Object.entries(EmploymentTypeLabels).map(([value, label]) => ({ value, label })),
    },
  ], []);

  const columns: ColumnsType<Employee> = [
    {
      title: 'Name',
      key: 'name',
      render: (_, record) => (
        <Link href={`/admin/employees/${record.employeeId}`} className="text-blue-600 hover:text-blue-800">
          <Text strong>{record.firstName} {record.lastName}</Text>
        </Link>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'],
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role: EmployeeRole) => <Tag>{EmployeeRoleLabels[role] || role}</Tag>,
    },
    {
      title: 'Type',
      dataIndex: 'employmentType',
      key: 'employmentType',
      responsive: ['lg'],
      render: (type: EmploymentType) => EmploymentTypeLabels[type] || type,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag type="employee" status={status} />,
    },
    {
      title: 'Specialization',
      dataIndex: 'specialization',
      key: 'specialization',
      responsive: ['xl'],
      render: (val: string) => val || <Text type="secondary">-</Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)} />
          <Link href={`/admin/employees/${record.employeeId}`}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Link>
        </div>
      ),
    },
  ];

  const roleOptions = useMemo(() => {
    if (!roles) return [];
    return roles
      .filter((r: any) => r.isAdminRole)
      .map((r: any) => ({ value: r.roleId, label: r.name }));
  }, [roles]);

  return (
    <>
      <PageHeader
        title="Employees"
        subtitle="Manage staff and trainer assignments"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Employees' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            Add Employee
          </Button>
        }
      />

      <FilterBar
        filters={filters}
        searchPlaceholder="Search employees..."
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      <Table
        dataSource={data?.data || []}
        columns={columns}
        loading={isLoading}
        rowKey="employeeId"
        size="small"
        scroll={{ x: true }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `${total} employees`,
          onChange: (page, pageSize) => setQuery((prev) => ({ ...prev, page, limit: pageSize })),
        }}
        locale={{
          emptyText: (
            <EmptyState
              icon={<TeamOutlined />}
              title="No employees yet"
              description="Add your first employee to get started"
              actionLabel="Add Employee"
              onAction={() => setDrawerOpen(true)}
            />
          ),
        }}
      />

      {/* Create Employee Drawer */}
      <Drawer
        title="Add New Employee"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={520}
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
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Required' }, { type: 'email', message: 'Invalid email' }]}>
            <Input placeholder="john@ispeakacademy.org" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="+254712345678" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="role" label="Employee Role" rules={[{ required: true, message: 'Required' }]}>
              <Select
                placeholder="Select role"
                options={Object.entries(EmployeeRoleLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="employmentType" label="Employment Type" rules={[{ required: true, message: 'Required' }]}>
              <Select
                placeholder="Select type"
                options={Object.entries(EmploymentTypeLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          </div>
          <Form.Item name="roleId" label="System Role (Login Access)" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select system role"
              options={roleOptions}
              loading={!roles}
            />
          </Form.Item>
          <Form.Item name="password" label="Temporary Password" rules={[{ required: true, message: 'Required' }, { min: 6, message: 'Min 6 characters' }]}>
            <Input.Password placeholder="Temporary password" />
          </Form.Item>
          <Form.Item name="specialization" label="Specialization">
            <Input placeholder="e.g., Public Speaking, Leadership" />
          </Form.Item>
          <Form.Item name="startDate" label="Start Date">
            <Input type="date" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="hourlyRate" label="Hourly Rate">
              <InputNumber className="w-full" placeholder="0.00" min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="rateCurrency" label="Currency">
              <Select placeholder="Currency" options={[
                { value: 'KES', label: 'KES' },
                { value: 'USD', label: 'USD' },
                { value: 'GBP', label: 'GBP' },
                { value: 'EUR', label: 'EUR' },
              ]} />
            </Form.Item>
          </div>
          <Form.Item name="availableDays" label="Available Days">
            <Select mode="multiple" placeholder="Select days" options={DAYS_OPTIONS} />
          </Form.Item>
          <Form.Item name="bio" label="Bio">
            <Input.TextArea rows={3} placeholder="Brief bio..." />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createEmployee.isPending}>
              Create Employee
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Edit Employee Drawer */}
      <Drawer
        title={editingEmployee ? `Edit ${editingEmployee.firstName} ${editingEmployee.lastName}` : 'Edit Employee'}
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingEmployee(null); }}
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

          <Form.Item name="systemRoleId" label="System Role (Login Access)">
            <Select
              placeholder="Select system role"
              options={roleOptions}
              loading={!roles}
            />
          </Form.Item>

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
            <Button onClick={() => { setEditDrawerOpen(false); setEditingEmployee(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateEmployee.isPending || updateEmployeeRole.isPending}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
