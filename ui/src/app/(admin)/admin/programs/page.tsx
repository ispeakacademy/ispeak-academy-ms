'use client';

import EmptyState from '@/components/admin/EmptyState';
import FilterBar from '@/components/admin/FilterBar';
import PageHeader from '@/components/admin/PageHeader';
import { useCreateProgram, usePrograms, useUpdateProgram } from '@/hooks/usePrograms';
import type { CreateProgramDto, Program, QueryProgramsDto } from '@/types/programs';
import { ProgramType, ProgramTypeLabels } from '@/types/enums';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined, SolutionOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, Form, Input, InputNumber, Modal, Select, Switch, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import Link from 'next/link';
import { useCallback, useMemo, useState } from 'react';

const { Text } = Typography;

export default function ProgramsPage() {
  const [query, setQuery] = useState<QueryProgramsDto>({ page: 1, limit: 20 });
  const [modalOpen, setModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const { data, isLoading } = usePrograms(query);
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();

  const handleFilterChange = useCallback((filters: Record<string, string | undefined>) => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      type: filters.type as ProgramType | undefined,
      isActive: filters.isActive === 'true' ? true : filters.isActive === 'false' ? false : undefined,
    }));
  }, []);

  const handleSearch = useCallback((search: string) => {
    setQuery((prev) => ({ ...prev, page: 1, search: search || undefined }));
  }, []);

  const handleCreate = async (values: CreateProgramDto) => {
    await createProgram.mutateAsync(values);
    setModalOpen(false);
    form.resetFields();
  };

  const openEditDrawer = (program: Program) => {
    setEditingProgram(program);
    editForm.setFieldsValue({
      code: program.code,
      name: program.name,
      type: program.type,
      description: program.description,
      shortDescription: program.shortDescription,
      durationWeeks: program.durationWeeks,
      durationLabel: program.durationLabel,
      minAge: program.minAge,
      maxAge: program.maxAge,
      targetAudience: program.targetAudience,
      keyOutcomes: program.keyOutcomes,
      isActive: program.isActive,
      isFeatured: program.isFeatured,
      pricingTiers: program.pricingTiers || [],
    });
    setEditDrawerOpen(true);
  };

  const handleEdit = async (values: any) => {
    if (!editingProgram) return;
    await updateProgram.mutateAsync({ id: editingProgram.programId, data: values });
    setEditDrawerOpen(false);
    setEditingProgram(null);
  };

  const filters = useMemo(() => [
    {
      key: 'type',
      placeholder: 'Program Type',
      options: Object.entries(ProgramTypeLabels).map(([value, label]) => ({ value, label })),
    },
    {
      key: 'isActive',
      placeholder: 'Status',
      options: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
    },
  ], []);

  const columns: ColumnsType<Program> = [
    {
      title: 'Program',
      key: 'name',
      render: (_, record) => (
        <Link href={`/admin/programs/${record.programId}`} className="text-blue-600 hover:text-blue-800">
          <div>
            <Text strong>{record.name}</Text>
            <br />
            <Text type="secondary" className="text-xs">{record.code}</Text>
          </div>
        </Link>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      responsive: ['md'],
      render: (type: ProgramType) => <Tag>{ProgramTypeLabels[type] || type}</Tag>,
    },
    {
      title: 'Duration',
      key: 'duration',
      responsive: ['lg'],
      render: (_, record) => record.durationLabel || (record.durationWeeks ? `${record.durationWeeks} weeks` : '-'),
    },
    {
      title: 'Modules',
      key: 'modules',
      responsive: ['md'],
      render: (_, record) => record.modules?.length || 0,
      align: 'center',
    },
    {
      title: 'Active',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (active: boolean) => <Tag color={active ? 'green' : 'default'}>{active ? 'Yes' : 'No'}</Tag>,
    },
    {
      title: '',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditDrawer(record)} />
          <Link href={`/admin/programs/${record.programId}`}>
            <Button type="text" size="small" icon={<EyeOutlined />} />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Programs"
        subtitle="Manage your program catalog"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Programs' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
            Create Program
          </Button>
        }
      />

      <FilterBar
        filters={filters}
        searchPlaceholder="Search programs..."
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
      />

      <Table
        dataSource={data?.data || []}
        columns={columns}
        loading={isLoading}
        rowKey="programId"
        size="small"
        scroll={{ x: true }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `${total} programs`,
          onChange: (page, pageSize) => setQuery((prev) => ({ ...prev, page, limit: pageSize })),
        }}
        locale={{
          emptyText: (
            <EmptyState
              icon={<SolutionOutlined />}
              title="No programs yet"
              description="Create your first program to get started"
              actionLabel="Create Program"
              onAction={() => setModalOpen(true)}
            />
          ),
        }}
      />

      {/* Create Program Modal */}
      <Modal
        title="Create Program"
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreate} className="mt-4">
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="code" label="Program Code" rules={[{ required: true, message: 'Required' }]}>
              <Input placeholder="e.g., JBC-101" />
            </Form.Item>
            <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Required' }]}>
              <Select
                placeholder="Select type"
                options={Object.entries(ProgramTypeLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
          </div>
          <Form.Item name="name" label="Program Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g., Junior Boot Camp" />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea rows={3} placeholder="Full program description" />
          </Form.Item>
          <Form.Item name="shortDescription" label="Short Description">
            <Input placeholder="Brief summary" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="durationWeeks" label="Duration (weeks)">
              <InputNumber min={1} className="w-full" placeholder="8" />
            </Form.Item>
            <Form.Item name="durationLabel" label="Duration Label">
              <Input placeholder="e.g., 8 Weeks, Flexible" />
            </Form.Item>
          </div>
          <div className="flex items-center gap-6 mb-4">
            <Form.Item name="isActive" label="Active" valuePropName="checked" initialValue={true} className="!mb-0">
              <Switch />
            </Form.Item>
            <Form.Item name="isFeatured" label="Featured" valuePropName="checked" initialValue={false} className="!mb-0">
              <Switch />
            </Form.Item>
          </div>
          <div className="mb-4">
            <Text strong className="block mb-2">Pricing Tiers</Text>
            <Form.List name="pricingTiers">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2 items-start">
                      <Form.Item {...restField} name={[name, 'label']} rules={[{ required: true, message: 'Label' }]} className="!mb-0">
                        <Input placeholder="Label (e.g., Standard)" size="small" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'currency']} rules={[{ required: true, message: 'Currency' }]} className="!mb-0">
                        <Select placeholder="Currency" size="small" options={[
                          { value: 'KES', label: 'KES' },
                          { value: 'USD', label: 'USD' },
                          { value: 'GBP', label: 'GBP' },
                          { value: 'EUR', label: 'EUR' },
                        ]} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'amount']} rules={[{ required: true, message: 'Amount' }]} className="!mb-0">
                        <InputNumber placeholder="Amount" size="small" min={0} className="!w-full" />
                      </Form.Item>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="small">
                    Add Pricing Tier
                  </Button>
                </>
              )}
            </Form.List>
          </div>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createProgram.isPending}>
              Create
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Edit Program Drawer */}
      <Drawer
        title={editingProgram ? `Edit ${editingProgram.name}` : 'Edit Program'}
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingProgram(null); }}
        width={520}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="code" label="Program Code" rules={[{ required: true, message: 'Required' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="type" label="Type" rules={[{ required: true, message: 'Required' }]}>
              <Select options={Object.entries(ProgramTypeLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
          </div>
          <Form.Item name="name" label="Program Name" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="shortDescription" label="Short Description">
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="durationWeeks" label="Duration (weeks)">
              <InputNumber min={1} className="!w-full" />
            </Form.Item>
            <Form.Item name="durationLabel" label="Duration Label">
              <Input placeholder="e.g., 8 Weeks, Flexible" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="minAge" label="Min Age">
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
            <Form.Item name="maxAge" label="Max Age">
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
          </div>
          <Form.Item name="targetAudience" label="Target Audience">
            <Select mode="tags" placeholder="Type audience and press Enter" />
          </Form.Item>
          <Form.Item name="keyOutcomes" label="Key Outcomes">
            <Select mode="tags" placeholder="Type outcome and press Enter" />
          </Form.Item>
          <div className="flex items-center gap-6 mb-4">
            <Form.Item name="isActive" label="Active" valuePropName="checked" className="!mb-0">
              <Switch />
            </Form.Item>
            <Form.Item name="isFeatured" label="Featured" valuePropName="checked" className="!mb-0">
              <Switch />
            </Form.Item>
          </div>
          <div className="mb-4">
            <Text strong className="block mb-2">Pricing Tiers</Text>
            <Form.List name="pricingTiers">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <div key={key} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-2 items-start">
                      <Form.Item {...restField} name={[name, 'label']} rules={[{ required: true, message: 'Label' }]} className="!mb-0">
                        <Input placeholder="Label" size="small" />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'currency']} rules={[{ required: true, message: 'Currency' }]} className="!mb-0">
                        <Select placeholder="Currency" size="small" options={[
                          { value: 'KES', label: 'KES' },
                          { value: 'USD', label: 'USD' },
                          { value: 'GBP', label: 'GBP' },
                          { value: 'EUR', label: 'EUR' },
                        ]} />
                      </Form.Item>
                      <Form.Item {...restField} name={[name, 'amount']} rules={[{ required: true, message: 'Amount' }]} className="!mb-0">
                        <InputNumber placeholder="Amount" size="small" min={0} className="!w-full" />
                      </Form.Item>
                      <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => remove(name)} />
                    </div>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} size="small">
                    Add Pricing Tier
                  </Button>
                </>
              )}
            </Form.List>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => { setEditDrawerOpen(false); setEditingProgram(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateProgram.isPending}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>
    </>
  );
}
