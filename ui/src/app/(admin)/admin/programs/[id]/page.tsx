'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import StatusTag from '@/components/admin/StatusTag';
import { useCohorts, useCreateCohort, useUpdateCohort } from '@/hooks/useCohorts';
import { useEmployees } from '@/hooks/useEmployees';
import { useCreateProgramModule, useDeleteProgramModule, useProgram, useProgramModules, useUpdateProgram, useUpdateProgramTrainers } from '@/hooks/usePrograms';
import { useAuth } from '@/contexts/AuthContext';
import type { CreateProgramModuleDto } from '@/types/programs';
import type { Cohort, CreateCohortDto } from '@/types/cohorts';
import { CohortStatus, CohortStatusLabels, DeliveryMode, DeliveryModeLabels, ProgramType, ProgramTypeLabels } from '@/types/enums';
import {
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { Button, Card, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, List, Modal, Popconfirm, Select, Switch, Table, Tabs, Tag, Typography } from 'antd';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

const { Text, Title } = Typography;

export default function ProgramDetailPage() {
  const params = useParams();
  const programId = params.id as string;

  const { data: program, isLoading } = useProgram(programId);
  const { data: modules, isLoading: loadingModules } = useProgramModules(programId);
  const { data: cohorts, isLoading: loadingCohorts } = useCohorts({ programId });

  const [moduleModalOpen, setModuleModalOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [cohortDrawerOpen, setCohortDrawerOpen] = useState(false);
  const [editCohortDrawerOpen, setEditCohortDrawerOpen] = useState(false);
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null);
  const [pricingModalOpen, setPricingModalOpen] = useState(false);
  const [editingPricingIndex, setEditingPricingIndex] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [cohortForm] = Form.useForm();
  const [editCohortForm] = Form.useForm();
  const [pricingForm] = Form.useForm();
  const createModule = useCreateProgramModule();
  const deleteModule = useDeleteProgramModule();
  const updateProgram = useUpdateProgram();
  const updateProgramTrainers = useUpdateProgramTrainers();
  const createCohort = useCreateCohort();
  const updateCohort = useUpdateCohort();
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

  const handleCreateModule = async (values: CreateProgramModuleDto) => {
    await createModule.mutateAsync({ programId, data: { ...values, orderIndex: (modules?.length || 0) + 1 } });
    setModuleModalOpen(false);
    form.resetFields();
  };

  const openEditDrawer = () => {
    if (!program) return;
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
    });
    setEditDrawerOpen(true);
  };

  const handleEditProgram = async (values: any) => {
    await updateProgram.mutateAsync({ id: programId, data: values });
    setEditDrawerOpen(false);
  };

  const handleCreateCohort = async (values: any) => {
    const data: CreateCohortDto = {
      ...values,
      programId,
      startDate: values.startDate?.format('YYYY-MM-DD'),
      endDate: values.endDate?.format('YYYY-MM-DD'),
    };
    await createCohort.mutateAsync(data);
    setCohortDrawerOpen(false);
    cohortForm.resetFields();
  };

  const openEditCohortDrawer = (cohort: Cohort) => {
    setEditingCohort(cohort);
    editCohortForm.setFieldsValue({
      name: cohort.name,
      batchCode: cohort.batchCode,
      deliveryMode: cohort.deliveryMode,
      venue: cohort.venue,
      meetingLink: cohort.meetingLink,
      meetingPassword: cohort.meetingPassword,
      maxCapacity: cohort.maxCapacity,
      status: cohort.status,
      notes: cohort.notes,
    });
    setEditCohortDrawerOpen(true);
  };

  const handleEditCohort = async (values: any) => {
    if (!editingCohort) return;
    await updateCohort.mutateAsync({ id: editingCohort.cohortId, data: values });
    setEditCohortDrawerOpen(false);
    setEditingCohort(null);
  };

  const handleAddPricingTier = async (values: any) => {
    if (!program) return;
    const tiers = [...(program.pricingTiers || [])];
    if (editingPricingIndex !== null) {
      tiers[editingPricingIndex] = values;
    } else {
      tiers.push(values);
    }
    await updateProgram.mutateAsync({ id: programId, data: { pricingTiers: tiers } });
    setPricingModalOpen(false);
    setEditingPricingIndex(null);
    pricingForm.resetFields();
  };

  const openEditPricingModal = (tier: any, index: number) => {
    setEditingPricingIndex(index);
    pricingForm.setFieldsValue(tier);
    setPricingModalOpen(true);
  };

  const handleDeletePricingTier = async (index: number) => {
    if (!program) return;
    const tiers = [...(program.pricingTiers || [])];
    tiers.splice(index, 1);
    await updateProgram.mutateAsync({ id: programId, data: { pricingTiers: tiers } });
  };

  if (isLoading) {
    return <div className="p-6"><Card loading /></div>;
  }

  if (!program) {
    return <EmptyState title="Program not found" />;
  }

  const tabItems = [
    {
      key: 'modules',
      label: `Modules (${modules?.length || 0})`,
      children: (
        <div>
          <div className="flex justify-end mb-4">
            <Button icon={<PlusOutlined />} onClick={() => setModuleModalOpen(true)}>
              Add Module
            </Button>
          </div>
          <List
            loading={loadingModules}
            dataSource={modules || []}
            locale={{ emptyText: <EmptyState icon={<BookOutlined />} title="No modules yet" description="Add modules to structure this program" actionLabel="Add Module" onAction={() => setModuleModalOpen(true)} /> }}
            renderItem={(mod, index) => (
              <List.Item
                key={mod.moduleId}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="Remove this module?"
                    onConfirm={() => deleteModule.mutate({ programId, moduleId: mod.moduleId })}
                  >
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
                      {index + 1}
                    </div>
                  }
                  title={<Text strong>{mod.title}</Text>}
                  description={
                    <div>
                      {mod.description && <Text type="secondary" className="text-sm">{mod.description}</Text>}
                      <div className="flex gap-2 mt-1">
                        {mod.estimatedHours && <Tag>~{mod.estimatedHours}h</Tag>}
                        {mod.isOptional && <Tag color="orange">Optional</Tag>}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      ),
    },
    {
      key: 'cohorts',
      label: `Cohorts (${cohorts?.data?.length || 0})`,
      children: (
        <div>
          <div className="flex justify-end mb-4">
            <Button icon={<PlusOutlined />} onClick={() => setCohortDrawerOpen(true)}>
              Add Cohort
            </Button>
          </div>
          <Table
            loading={loadingCohorts}
            dataSource={cohorts?.data || []}
            rowKey="cohortId"
            size="small"
            scroll={{ x: true }}
            pagination={false}
            columns={[
              {
                title: 'Cohort',
                key: 'name',
                render: (_, record) => (
                  <div>
                    <Text strong>{record.name}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">{record.batchCode}</Text>
                  </div>
                ),
              },
              {
                title: 'Mode',
                dataIndex: 'deliveryMode',
                key: 'deliveryMode',
                responsive: ['lg'],
                render: (mode: DeliveryMode) => DeliveryModeLabels[mode] || mode,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (s: string) => <StatusTag type="cohort" status={s} />,
              },
              {
                title: 'Capacity',
                key: 'capacity',
                render: (_, r) => `${r.currentEnrollment}/${r.maxCapacity}`,
              },
              {
                title: 'Dates',
                key: 'dates',
                responsive: ['md'],
                render: (_, r) => `${new Date(r.startDate).toLocaleDateString()} - ${new Date(r.endDate).toLocaleDateString()}`,
              },
              {
                title: '',
                key: 'actions',
                width: 60,
                render: (_, record) => (
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditCohortDrawer(record)} />
                ),
              },
            ]}
            locale={{ emptyText: <EmptyState title="No cohorts" description="Create a cohort to start enrolling students" actionLabel="Add Cohort" onAction={() => setCohortDrawerOpen(true)} /> }}
          />
        </div>
      ),
    },
    {
      key: 'pricing',
      label: 'Pricing',
      children: (
        <div>
          <div className="flex justify-end mb-4">
            <Button icon={<PlusOutlined />} onClick={() => setPricingModalOpen(true)}>
              Add Pricing Tier
            </Button>
          </div>
          {program.pricingTiers && program.pricingTiers.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {program.pricingTiers.map((tier, i) => (
                <Card key={i} size="small" actions={[
                  <Button key="edit" type="text" size="small" icon={<EditOutlined />} onClick={() => openEditPricingModal(tier, i)} />,
                  <Popconfirm key="delete" title="Remove this pricing tier?" onConfirm={() => handleDeletePricingTier(i)}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}>
                  <div className="text-center">
                    <Text type="secondary" className="text-sm">{tier.label}</Text>
                    <div className="text-2xl font-bold mt-1">
                      {tier.currency} {tier.amount.toLocaleString()}
                    </div>
                    {tier.validUntil && (
                      <Text type="secondary" className="text-xs">
                        Until {new Date(tier.validUntil).toLocaleDateString()}
                      </Text>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <EmptyState title="No pricing tiers" description="Add pricing tiers to this program" actionLabel="Add Pricing Tier" onAction={() => setPricingModalOpen(true)} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={program.name}
        subtitle={program.shortDescription || undefined}
        breadcrumbs={[
          { label: 'Dashboard', href: '/admin' },
          { label: 'Programs', href: '/admin/programs' },
          { label: program.name },
        ]}
        actions={
          <Button icon={<EditOutlined />} onClick={openEditDrawer}>
            Edit Program
          </Button>
        }
      />

      <Card size="small" className="mb-6">
        <Descriptions column={{ xs: 1, sm: 2, lg: 3 }} size="small">
          <Descriptions.Item label="Code">{program.code}</Descriptions.Item>
          <Descriptions.Item label="Type">
            <Tag>{ProgramTypeLabels[program.type] || program.type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Duration">
            {program.durationLabel || (program.durationWeeks ? `${program.durationWeeks} weeks` : '-')}
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <Tag color={program.isActive ? 'green' : 'default'}>{program.isActive ? 'Active' : 'Inactive'}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Featured">
            {program.isFeatured ? 'Yes' : 'No'}
          </Descriptions.Item>
          <Descriptions.Item label="Age Range">
            {program.minAge || program.maxAge
              ? `${program.minAge || '?'} - ${program.maxAge || '?'} years`
              : '-'}
          </Descriptions.Item>
        </Descriptions>
        {program.description && (
          <div className="mt-3 pt-3 border-t">
            <Text type="secondary" className="text-sm">{program.description}</Text>
          </div>
        )}
      </Card>

      {isAdmin && (
        <Card title="Assigned Trainers" size="small" className="mb-6">
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="Select trainers to assign"
            value={program.trainerIds || []}
            options={employeeOptions}
            onChange={(trainerIds) => updateProgramTrainers.mutate({ programId, trainerIds })}
            loading={updateProgramTrainers.isPending}
            showSearch
            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
          />
        </Card>
      )}

      <Tabs items={tabItems} />

      {/* Add Module Modal */}
      <Modal
        title="Add Module"
        open={moduleModalOpen}
        onCancel={() => setModuleModalOpen(false)}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateModule} className="mt-4">
          <Form.Item name="title" label="Module Title" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g., Introduction to Public Speaking" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="estimatedHours" label="Estimated Hours">
              <InputNumber min={0.5} step={0.5} className="w-full" />
            </Form.Item>
            <Form.Item name="isOptional" label="Optional" valuePropName="checked" initialValue={false}>
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="materials" label="Materials URL">
            <Input placeholder="Link to materials" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => setModuleModalOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createModule.isPending}>
              Add Module
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Create Cohort Drawer */}
      <Drawer
        title="Add New Cohort"
        open={cohortDrawerOpen}
        onClose={() => setCohortDrawerOpen(false)}
        width={520}
        destroyOnHidden
      >
        <Form form={cohortForm} layout="vertical" onFinish={handleCreateCohort}>
          <Form.Item name="name" label="Cohort Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g., JBC-101 Cohort 4 — Jan 2025" />
          </Form.Item>
          <Form.Item name="batchCode" label="Batch Code" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g., JBC-101-C4" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="deliveryMode" label="Delivery Mode" rules={[{ required: true, message: 'Required' }]}>
              <Select
                placeholder="Select mode"
                options={Object.entries(DeliveryModeLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="maxCapacity" label="Max Capacity" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={1} className="!w-full" placeholder="20" />
            </Form.Item>
          </div>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: 'Required' }]}>
              <DatePicker className="!w-full" />
            </Form.Item>
            <Form.Item name="endDate" label="End Date" rules={[{ required: true, message: 'Required' }]}>
              <DatePicker className="!w-full" />
            </Form.Item>
          </div>
          <Form.Item name="venue" label="Venue">
            <Input placeholder="Physical location (for in-person)" />
          </Form.Item>
          <Form.Item name="meetingLink" label="Meeting Link">
            <Input placeholder="Zoom/Meet link (for virtual)" />
          </Form.Item>
          <Form.Item name="meetingPassword" label="Meeting Password">
            <Input placeholder="Meeting password" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} placeholder="Additional notes..." />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setCohortDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createCohort.isPending}>
              Create Cohort
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Edit Cohort Drawer */}
      <Drawer
        title={editingCohort ? `Edit ${editingCohort.name}` : 'Edit Cohort'}
        open={editCohortDrawerOpen}
        onClose={() => { setEditCohortDrawerOpen(false); setEditingCohort(null); }}
        width={520}
        destroyOnHidden
      >
        <Form form={editCohortForm} layout="vertical" onFinish={handleEditCohort}>
          <Form.Item name="name" label="Cohort Name" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="batchCode" label="Batch Code" rules={[{ required: true, message: 'Required' }]}>
            <Input />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="deliveryMode" label="Delivery Mode" rules={[{ required: true, message: 'Required' }]}>
              <Select options={Object.entries(DeliveryModeLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true, message: 'Required' }]}>
              <Select options={Object.entries(CohortStatusLabels).map(([value, label]) => ({ value, label }))} />
            </Form.Item>
          </div>
          <Form.Item name="maxCapacity" label="Max Capacity" rules={[{ required: true, message: 'Required' }]}>
            <InputNumber min={1} className="!w-full" />
          </Form.Item>
          <Form.Item name="venue" label="Venue">
            <Input placeholder="Physical location" />
          </Form.Item>
          <Form.Item name="meetingLink" label="Meeting Link">
            <Input placeholder="Zoom/Meet link" />
          </Form.Item>
          <Form.Item name="meetingPassword" label="Meeting Password">
            <Input placeholder="Meeting password" />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => { setEditCohortDrawerOpen(false); setEditingCohort(null); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateCohort.isPending}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Edit Program Drawer */}
      <Drawer
        title={program ? `Edit ${program.name}` : 'Edit Program'}
        open={editDrawerOpen}
        onClose={() => setEditDrawerOpen(false)}
        width={520}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleEditProgram}>
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
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => setEditDrawerOpen(false)}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateProgram.isPending}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Pricing Tier Modal (Add/Edit) */}
      <Modal
        title={editingPricingIndex !== null ? 'Edit Pricing Tier' : 'Add Pricing Tier'}
        open={pricingModalOpen}
        onCancel={() => { setPricingModalOpen(false); setEditingPricingIndex(null); pricingForm.resetFields(); }}
        footer={null}
        destroyOnHidden
      >
        <Form form={pricingForm} layout="vertical" onFinish={handleAddPricingTier} className="mt-4">
          <Form.Item name="label" label="Label" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g., Early Bird, Standard, Corporate" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="currency" label="Currency" rules={[{ required: true, message: 'Required' }]}>
              <Select placeholder="Select currency" options={[
                { value: 'KES', label: 'KES' },
                { value: 'USD', label: 'USD' },
                { value: 'GBP', label: 'GBP' },
                { value: 'EUR', label: 'EUR' },
              ]} />
            </Form.Item>
            <Form.Item name="amount" label="Amount" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} className="!w-full" placeholder="e.g., 15000" />
            </Form.Item>
          </div>
          <Form.Item name="validUntil" label="Valid Until (optional)">
            <Input type="date" />
          </Form.Item>
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setPricingModalOpen(false); setEditingPricingIndex(null); pricingForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateProgram.isPending}>
              {editingPricingIndex !== null ? 'Save Changes' : 'Add Tier'}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
