'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import StatusTag from '@/components/admin/StatusTag';
import { useClients, useClientSearch } from '@/hooks/useClients';
import { useCohorts } from '@/hooks/useCohorts';
import {
  useApproveEnrollment,
  useCompleteEnrollment,
  useConfirmEnrollment,
  useCreateEnrollment,
  useDropEnrollment,
  useEnrollmentProgress,
  useEnrollments,
  useRejectEnrollment,
  useUpdateEnrollment,
  useUpdateModuleProgress,
} from '@/hooks/useEnrollments';
import {
  useAssignmentsByEnrollment,
  useCreateAssignment,
  useReviewSubmission,
} from '@/hooks/useAssignments';
import { usePrograms } from '@/hooks/usePrograms';
import type { CreateEnrollmentDto, Enrollment, ModuleProgress, QueryEnrollmentsDto } from '@/types/enrollments';
import type { Assignment, AssignmentSubmission } from '@/types/assignments';
import { SubmissionStatus } from '@/types/assignments';
import {
  CohortStatus,
  CohortStatusLabels,
  EnrollmentStatus,
  EnrollmentStatusLabels,
  ProgressStatus,
  ProgressStatusLabels,
} from '@/types/enums';
import {
  BarChartOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  FileTextOutlined,
  FormOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { Button, DatePicker, Drawer, Form, Input, InputNumber, List, Modal, Progress, Select, Skeleton, Space, Table, Tabs, Tag, Tooltip, Typography, Upload } from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo, useState } from 'react';

const { Text } = Typography;

const CURRENCY_OPTIONS = [
  { value: 'KES', label: 'KES — Kenyan Shilling' },
  { value: 'USD', label: 'USD — US Dollar' },
  { value: 'GBP', label: 'GBP — British Pound' },
  { value: 'EUR', label: 'EUR — Euro' },
];

const statusTabs = [
  { key: '', label: 'All' },
  ...Object.entries(EnrollmentStatusLabels).map(([value, label]) => ({
    key: value,
    label,
  })),
];

export default function EnrollmentsPage() {
  const [query, setQuery] = useState<QueryEnrollmentsDto>({ page: 1, limit: 20 });
  const [activeTab, setActiveTab] = useState('');
  const [rejectModal, setRejectModal] = useState<{ open: boolean; enrollmentId: string }>({ open: false, enrollmentId: '' });
  const [dropModal, setDropModal] = useState<{ open: boolean; enrollmentId: string }>({ open: false, enrollmentId: '' });
  const [reason, setReason] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [editingEnrollment, setEditingEnrollment] = useState<Enrollment | null>(null);
  const [editProgramId, setEditProgramId] = useState<string | undefined>();
  const [selectedProgramId, setSelectedProgramId] = useState<string | undefined>();
  const [clientSearch, setClientSearch] = useState('');
  const [progressDrawer, setProgressDrawer] = useState<{ open: boolean; enrollment: Enrollment | null }>({ open: false, enrollment: null });
  const [editingModule, setEditingModule] = useState<ModuleProgress | null>(null);
  const [addAssignmentModal, setAddAssignmentModal] = useState(false);
  const [reviewingSubmission, setReviewingSubmission] = useState<AssignmentSubmission | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [progressForm] = Form.useForm();
  const [assignmentForm] = Form.useForm();
  const [reviewForm] = Form.useForm();

  const { data, isLoading } = useEnrollments(query);
  const approveEnrollment = useApproveEnrollment();
  const rejectEnrollment = useRejectEnrollment();
  const confirmEnrollment = useConfirmEnrollment();
  const dropEnrollment = useDropEnrollment();
  const completeEnrollment = useCompleteEnrollment();
  const createEnrollment = useCreateEnrollment();
  const updateEnrollment = useUpdateEnrollment();
  const updateModuleProgress = useUpdateModuleProgress();
  const { data: progressData, isLoading: progressLoading } = useEnrollmentProgress(
    progressDrawer.enrollment?.enrollmentId || '',
    progressDrawer.open,
  );
  const { data: enrollmentAssignments, isLoading: assignmentsLoading } = useAssignmentsByEnrollment(
    progressDrawer.enrollment?.enrollmentId || '',
    progressDrawer.open,
  );
  const createAssignment = useCreateAssignment();
  const reviewSubmission = useReviewSubmission();

  // Data for the create enrollment drawer
  const { data: programsData } = usePrograms({ isActive: true, limit: 100 });
  const { data: cohortsData } = useCohorts(selectedProgramId ? { programId: selectedProgramId, limit: 100 } : undefined);
  const { data: editCohortsData } = useCohorts(editProgramId ? { programId: editProgramId, limit: 100 } : undefined);
  const { data: clientsListData } = useClients({ limit: 50 });
  const { data: clientsSearchData } = useClientSearch(clientSearch);

  const clientOptions = useMemo(() => {
    // When searching (2+ chars), use search results; otherwise show initial list
    if (clientSearch.length >= 2 && clientsSearchData) {
      return clientsSearchData.map((c) => ({
        value: c.clientId,
        label: `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ''}`,
      }));
    }
    const clients = clientsListData?.data || [];
    return clients.map((c) => ({
      value: c.clientId,
      label: `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ''}`,
    }));
  }, [clientSearch, clientsSearchData, clientsListData]);

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

  const editCohortOptions = useMemo(() => {
    const cohorts = editCohortsData?.data || [];
    return cohorts.map((c) => ({
      value: c.cohortId,
      label: `${c.name} — ${c.currentEnrollment}/${c.maxCapacity}`,
    }));
  }, [editCohortsData]);

  const openEditDrawer = (enrollment: Enrollment) => {
    setEditingEnrollment(enrollment);
    setEditProgramId(enrollment.programId);
    editForm.setFieldsValue({
      cohortId: enrollment.cohortId,
      agreedAmount: Number(enrollment.agreedAmount),
      agreedCurrency: enrollment.agreedCurrency,
      discountCode: enrollment.discountCode,
      discountPercent: enrollment.discountPercent,
    });
    setEditDrawerOpen(true);
  };

  const handleEdit = async (values: any) => {
    if (!editingEnrollment) return;
    await updateEnrollment.mutateAsync({ id: editingEnrollment.enrollmentId, data: values });
    setEditDrawerOpen(false);
    setEditingEnrollment(null);
    setEditProgramId(undefined);
  };

  const handleCreateEnrollment = async (values: any) => {
    const clientIds: string[] = Array.isArray(values.clientIds) ? values.clientIds : [values.clientIds];
    for (const clientId of clientIds) {
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
    }
    setDrawerOpen(false);
    form.resetFields();
    setSelectedProgramId(undefined);
    setClientSearch('');
  };

  const handleProgramChange = (programId: string) => {
    setSelectedProgramId(programId);
    form.setFieldValue('cohortId', undefined);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    form.resetFields();
    setSelectedProgramId(undefined);
    setClientSearch('');
  };

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setQuery((prev) => ({
      ...prev,
      page: 1,
      status: key ? (key as EnrollmentStatus) : undefined,
    }));
  }, []);

  const handleReject = async () => {
    if (!reason.trim()) return;
    await rejectEnrollment.mutateAsync({ id: rejectModal.enrollmentId, reason });
    setRejectModal({ open: false, enrollmentId: '' });
    setReason('');
  };

  const handleDrop = async () => {
    if (!reason.trim()) return;
    await dropEnrollment.mutateAsync({ id: dropModal.enrollmentId, reason });
    setDropModal({ open: false, enrollmentId: '' });
    setReason('');
  };

  const getActions = (record: Enrollment) => {
    const actions: React.ReactNode[] = [
      <Tooltip title="Edit" key="edit">
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={() => openEditDrawer(record)}
        />
      </Tooltip>,
      <Tooltip title="Progress" key="progress">
        <Button
          type="text"
          size="small"
          icon={<BarChartOutlined />}
          onClick={() => setProgressDrawer({ open: true, enrollment: record })}
        />
      </Tooltip>,
    ];

    if (record.status === EnrollmentStatus.APPLIED) {
      actions.push(
        <Tooltip title="Approve" key="approve">
          <Button
            type="text"
            size="small"
            icon={<CheckCircleOutlined className="text-green-600" />}
            onClick={() => approveEnrollment.mutate(record.enrollmentId)}
            loading={approveEnrollment.isPending}
          />
        </Tooltip>,
        <Tooltip title="Reject" key="reject">
          <Button
            type="text"
            size="small"
            icon={<CloseCircleOutlined className="text-red-600" />}
            onClick={() => setRejectModal({ open: true, enrollmentId: record.enrollmentId })}
          />
        </Tooltip>,
      );
    }

    if (record.status === EnrollmentStatus.APPROVED || record.status === EnrollmentStatus.INVOICE_SENT) {
      actions.push(
        <Tooltip title="Confirm Payment" key="confirm">
          <Button
            type="text"
            size="small"
            icon={<CheckCircleOutlined className="text-blue-600" />}
            onClick={() => confirmEnrollment.mutate(record.enrollmentId)}
            loading={confirmEnrollment.isPending}
          />
        </Tooltip>,
      );
    }

    if (record.status === EnrollmentStatus.ACTIVE) {
      actions.push(
        <Tooltip title="Complete" key="complete">
          <Button
            type="text"
            size="small"
            icon={<CheckCircleOutlined className="text-purple-600" />}
            onClick={() => completeEnrollment.mutate(record.enrollmentId)}
            loading={completeEnrollment.isPending}
          />
        </Tooltip>,
        <Tooltip title="Drop" key="drop">
          <Button
            type="text"
            size="small"
            icon={<StopOutlined className="text-red-600" />}
            onClick={() => setDropModal({ open: true, enrollmentId: record.enrollmentId })}
          />
        </Tooltip>,
      );
    }

    return actions;
  };

  const columns: ColumnsType<Enrollment> = [
    {
      title: 'Client',
      key: 'client',
      render: (_, record) => record.client
        ? <Text strong>{record.client.firstName} {record.client.lastName}</Text>
        : <Text type="secondary">-</Text>,
    },
    {
      title: 'Program',
      key: 'program',
      responsive: ['md'],
      render: (_, record) => record.program
        ? <Text>{record.program.name}</Text>
        : <Text type="secondary">-</Text>,
    },
    {
      title: 'Cohort',
      key: 'cohort',
      responsive: ['lg'],
      render: (_, record) => record.cohort?.name || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <StatusTag type="enrollment" status={status} />,
    },
    {
      title: 'Amount',
      key: 'amount',
      responsive: ['md'],
      render: (_, record) => `${record.agreedCurrency} ${Number(record.agreedAmount).toLocaleString()}`,
    },
    {
      title: 'Progress',
      dataIndex: 'progressPercent',
      key: 'progress',
      responsive: ['lg'],
      render: (p: any) => `${Math.round(Number(p) || 0)}%`,
      width: 80,
      align: 'center',
    },
    {
      title: 'Date',
      key: 'date',
      responsive: ['xl'],
      render: (_, record) => new Date(record.createdAt).toLocaleDateString(),
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, record) => <Space size={0}>{getActions(record)}</Space>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Enrollments"
        subtitle="Manage student enrollments across all programs"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Enrollments' }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerOpen(true)}>
            New Enrollment
          </Button>
        }
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusTabs.slice(0, 8).map((tab) => (
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
        rowKey="enrollmentId"
        size="small"
        scroll={{ x: true }}
        pagination={{
          current: query.page,
          pageSize: query.limit,
          total: data?.total || 0,
          showSizeChanger: true,
          showTotal: (total) => `${total} enrollments`,
          onChange: (page, pageSize) => setQuery((prev) => ({ ...prev, page, limit: pageSize })),
        }}
        locale={{
          emptyText: (
            <EmptyState
              icon={<FileTextOutlined />}
              title="No enrollments"
              description={activeTab ? `No ${EnrollmentStatusLabels[activeTab as EnrollmentStatus]?.toLowerCase()} enrollments` : 'No enrollments found'}
            />
          ),
        }}
      />

      {/* Reject Modal */}
      <Modal
        title="Reject Enrollment"
        open={rejectModal.open}
        onCancel={() => { setRejectModal({ open: false, enrollmentId: '' }); setReason(''); }}
        onOk={handleReject}
        confirmLoading={rejectEnrollment.isPending}
        okText="Reject"
        okButtonProps={{ danger: true }}
      >
        <div className="mt-4">
          <Text>Please provide a reason for rejection:</Text>
          <Input.TextArea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection..."
            className="mt-2"
          />
        </div>
      </Modal>

      {/* Drop Modal */}
      <Modal
        title="Drop Enrollment"
        open={dropModal.open}
        onCancel={() => { setDropModal({ open: false, enrollmentId: '' }); setReason(''); }}
        onOk={handleDrop}
        confirmLoading={dropEnrollment.isPending}
        okText="Drop"
        okButtonProps={{ danger: true }}
      >
        <div className="mt-4">
          <Text>Please provide a reason for dropping this enrollment:</Text>
          <Input.TextArea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for dropping..."
            className="mt-2"
          />
        </div>
      </Modal>

      {/* Create Enrollment Drawer */}
      <Drawer
        title="New Enrollment"
        open={drawerOpen}
        onClose={handleDrawerClose}
        width={480}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleCreateEnrollment}>
          <Form.Item name="clientIds" label="Clients" rules={[{ required: true, message: 'Please select at least one client' }]}>
            <Select
              mode="multiple"
              showSearch
              placeholder="Search and select clients..."
              filterOption={false}
              onSearch={setClientSearch}
              options={clientOptions}
              notFoundContent={clientSearch.length >= 2 && (!clientsSearchData || clientsSearchData.length === 0) ? 'No clients found' : null}
            />
          </Form.Item>

          <Form.Item name="programId" label="Program" rules={[{ required: true, message: 'Please select a program' }]}>
            <Select
              placeholder="Select program"
              options={programOptions}
              onChange={handleProgramChange}
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
            <Button onClick={handleDrawerClose}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createEnrollment.isPending}>
              Create Enrollment
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Edit Enrollment Drawer */}
      <Drawer
        title={editingEnrollment
          ? `Edit Enrollment — ${editingEnrollment.client?.firstName || ''} ${editingEnrollment.client?.lastName || ''}`
          : 'Edit Enrollment'}
        open={editDrawerOpen}
        onClose={() => { setEditDrawerOpen(false); setEditingEnrollment(null); setEditProgramId(undefined); }}
        width={480}
        destroyOnHidden
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          {editingEnrollment?.program && (
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <Text type="secondary">Program:</Text>{' '}
              <Text strong>{editingEnrollment.program.name} ({editingEnrollment.program.code})</Text>
            </div>
          )}

          <Form.Item name="cohortId" label="Cohort">
            <Select
              allowClear
              placeholder="Select cohort"
              options={editCohortOptions}
              loading={!editCohortsData && !!editProgramId}
            />
          </Form.Item>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="agreedAmount" label="Agreed Amount" rules={[{ required: true, message: 'Required' }]}>
              <InputNumber min={0} className="!w-full" />
            </Form.Item>
            <Form.Item name="agreedCurrency" label="Currency" rules={[{ required: true, message: 'Required' }]}>
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Form.Item name="discountCode" label="Discount Code">
              <Input placeholder="e.g. EARLY2025" />
            </Form.Item>
            <Form.Item name="discountPercent" label="Discount %">
              <InputNumber min={0} max={100} className="!w-full" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={() => { setEditDrawerOpen(false); setEditingEnrollment(null); setEditProgramId(undefined); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={updateEnrollment.isPending}>
              Save Changes
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Progress Drawer with Tabs */}
      <Drawer
        title={progressDrawer.enrollment
          ? `Progress — ${progressDrawer.enrollment.client?.firstName || ''} ${progressDrawer.enrollment.client?.lastName || ''}`
          : 'Progress'}
        open={progressDrawer.open}
        onClose={() => { setProgressDrawer({ open: false, enrollment: null }); setEditingModule(null); progressForm.resetFields(); setReviewingSubmission(null); }}
        width={600}
        destroyOnHidden
      >
        {progressDrawer.enrollment?.program && (
          <div className="mb-4 p-3 bg-gray-50 rounded">
            <Text type="secondary">Program:</Text>{' '}
            <Text strong>{progressDrawer.enrollment.program.name}</Text>
          </div>
        )}

        {progressData?.progressPercent !== undefined && (
          <div className="mb-4">
            <Text type="secondary" className="text-sm">Overall Progress</Text>
            <Progress percent={Math.round(Number(progressData.progressPercent) || 0)} size="small" />
          </div>
        )}

        <Tabs
          defaultActiveKey="modules"
          items={[
            {
              key: 'modules',
              label: 'Modules',
              children: progressLoading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <>
                  {(progressData?.modules || []).length === 0 ? (
                    <EmptyState
                      title="No modules"
                      description="Module progress will appear here once the enrollment is confirmed and modules are initialized."
                    />
                  ) : (
                    <List
                      dataSource={progressData?.modules || []}
                      renderItem={(mod, index) => (
                        <List.Item
                          key={mod.moduleProgressId}
                          className={`cursor-pointer hover:bg-gray-50 rounded ${editingModule?.moduleProgressId === mod.moduleProgressId ? 'bg-blue-50' : ''}`}
                          onClick={() => {
                            setEditingModule(mod);
                            progressForm.setFieldsValue({
                              status: mod.status,
                              score: mod.score,
                              trainerFeedback: mod.trainerFeedback || '',
                            });
                          }}
                        >
                          <List.Item.Meta
                            avatar={
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                mod.status === 'completed' ? 'bg-green-100 text-green-600' :
                                mod.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                mod.status === 'failed' ? 'bg-red-100 text-red-600' :
                                'bg-gray-100 text-gray-400'
                              }`}>
                                {mod.status === 'completed' ? <CheckCircleOutlined /> : index + 1}
                              </div>
                            }
                            title={
                              <div className="flex items-center gap-2">
                                <Text strong>{mod.module?.title || `Module ${index + 1}`}</Text>
                                <Tag color={
                                  mod.status === 'completed' ? 'success' :
                                  mod.status === 'in_progress' ? 'processing' :
                                  mod.status === 'failed' ? 'error' : 'default'
                                }>
                                  {ProgressStatusLabels[mod.status as ProgressStatus] || mod.status}
                                </Tag>
                                {mod.module?.isOptional && <Tag>Optional</Tag>}
                              </div>
                            }
                            description={
                              <div>
                                {mod.module?.description && (
                                  <Text type="secondary" className="text-xs">{mod.module.description}</Text>
                                )}
                                {mod.score !== null && mod.score !== undefined && (
                                  <span className="ml-2 text-xs text-gray-500">Score: {mod.score}%</span>
                                )}
                              </div>
                            }
                          />
                        </List.Item>
                      )}
                    />
                  )}

                  {editingModule && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <Text strong>Update: {editingModule.module?.title || 'Module'}</Text>
                        <Button type="text" size="small" onClick={() => { setEditingModule(null); progressForm.resetFields(); }}>
                          <CloseCircleOutlined />
                        </Button>
                      </div>
                      <Form
                        form={progressForm}
                        layout="vertical"
                        size="small"
                        onFinish={async (values) => {
                          if (!progressDrawer.enrollment) return;
                          await updateModuleProgress.mutateAsync({
                            enrollmentId: progressDrawer.enrollment.enrollmentId,
                            moduleId: editingModule.moduleId,
                            data: values,
                          });
                          setEditingModule(null);
                          progressForm.resetFields();
                        }}
                      >
                        <Form.Item name="status" label="Status">
                          <Select
                            options={Object.entries(ProgressStatusLabels).map(([value, label]) => ({ value, label }))}
                          />
                        </Form.Item>

                        <Form.Item name="score" label="Score (%)">
                          <InputNumber min={0} max={100} className="!w-full" placeholder="Optional — 0 to 100" />
                        </Form.Item>

                        <Form.Item name="trainerFeedback" label="Trainer Feedback">
                          <Input.TextArea rows={3} placeholder="Optional feedback for the client..." />
                        </Form.Item>

                        <div className="flex justify-end gap-2">
                          <Button onClick={() => { setEditingModule(null); progressForm.resetFields(); }}>Cancel</Button>
                          <Button type="primary" htmlType="submit" loading={updateModuleProgress.isPending}>
                            Save Progress
                          </Button>
                        </div>
                      </Form>
                    </div>
                  )}
                </>
              ),
            },
            {
              key: 'assignments',
              label: 'Assignments',
              children: assignmentsLoading ? (
                <Skeleton active paragraph={{ rows: 4 }} />
              ) : (
                <>
                  {/* Assignment Summary */}
                  {progressData?.assignmentSummary && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Tag>{progressData.assignmentSummary.total} total</Tag>
                      <Tag color="default">{progressData.assignmentSummary.pending} pending</Tag>
                      <Tag color="processing">{progressData.assignmentSummary.submitted} submitted</Tag>
                      <Tag color="success">{progressData.assignmentSummary.reviewed} reviewed</Tag>
                      {progressData.assignmentSummary.revisionRequested > 0 && (
                        <Tag color="warning">{progressData.assignmentSummary.revisionRequested} revision</Tag>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    <Button
                      type="primary"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => { setAddAssignmentModal(true); assignmentForm.resetFields(); }}
                    >
                      Add Assignment
                    </Button>
                  </div>

                  {(!enrollmentAssignments || enrollmentAssignments.length === 0) ? (
                    <EmptyState
                      icon={<FormOutlined />}
                      title="No assignments"
                      description="Create an assignment for this enrollment."
                    />
                  ) : (
                    <List
                      dataSource={enrollmentAssignments}
                      renderItem={(assignment: Assignment) => {
                        const sub = assignment.submissions?.[0];
                        const subStatus = sub?.status || 'pending';
                        const subColor = subStatus === 'reviewed' ? 'success' :
                          subStatus === 'submitted' ? 'processing' :
                          subStatus === 'revision_requested' ? 'warning' : 'default';
                        return (
                          <List.Item
                            key={assignment.assignmentId}
                            actions={
                              sub?.status === 'submitted' ? [
                                <Button
                                  key="review"
                                  type="link"
                                  size="small"
                                  onClick={() => {
                                    setReviewingSubmission(sub);
                                    reviewForm.resetFields();
                                  }}
                                >
                                  Review
                                </Button>
                              ] : undefined
                            }
                          >
                            <List.Item.Meta
                              title={
                                <div className="flex items-center gap-2">
                                  <Text strong>{assignment.title}</Text>
                                  <Tag color={subColor} className="text-xs">
                                    {subStatus === 'revision_requested' ? 'Revision' : subStatus}
                                  </Tag>
                                </div>
                              }
                              description={
                                <div>
                                  {assignment.dueDate && (
                                    <Text type="secondary" className="text-xs">
                                      <CalendarOutlined className="mr-1" />
                                      Due: {dayjs(assignment.dueDate).format('MMM D, YYYY')}
                                    </Text>
                                  )}
                                  {sub?.score !== null && sub?.score !== undefined && (
                                    <Text type="secondary" className="text-xs ml-2">
                                      Score: {sub.score}%
                                    </Text>
                                  )}
                                </div>
                              }
                            />
                          </List.Item>
                        );
                      }}
                    />
                  )}

                  {/* Review Submission Form */}
                  {reviewingSubmission && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <Text strong>Review Submission</Text>
                        <Button type="text" size="small" onClick={() => { setReviewingSubmission(null); reviewForm.resetFields(); }}>
                          <CloseCircleOutlined />
                        </Button>
                      </div>

                      {reviewingSubmission.notes && (
                        <div className="mb-3 p-2 bg-white rounded text-sm">
                          <Text type="secondary" className="text-xs block">Student Notes:</Text>
                          <Text>{reviewingSubmission.notes}</Text>
                        </div>
                      )}

                      <Form
                        form={reviewForm}
                        layout="vertical"
                        size="small"
                        onFinish={async (values) => {
                          await reviewSubmission.mutateAsync({
                            submissionId: reviewingSubmission.submissionId,
                            data: {
                              status: values.status,
                              feedback: values.feedback || undefined,
                              score: values.score,
                            },
                          });
                          setReviewingSubmission(null);
                          reviewForm.resetFields();
                        }}
                      >
                        <Form.Item name="status" label="Decision" rules={[{ required: true }]}>
                          <Select
                            options={[
                              { value: SubmissionStatus.REVIEWED, label: 'Approve' },
                              { value: SubmissionStatus.REVISION_REQUESTED, label: 'Request Revision' },
                            ]}
                          />
                        </Form.Item>

                        <Form.Item name="score" label="Score (%)">
                          <InputNumber min={0} max={100} className="!w-full" placeholder="Optional" />
                        </Form.Item>

                        <Form.Item name="feedback" label="Feedback">
                          <Input.TextArea rows={3} placeholder="Feedback for the student..." />
                        </Form.Item>

                        <div className="flex justify-end gap-2">
                          <Button onClick={() => { setReviewingSubmission(null); reviewForm.resetFields(); }}>Cancel</Button>
                          <Button type="primary" htmlType="submit" loading={reviewSubmission.isPending}>
                            Submit Review
                          </Button>
                        </div>
                      </Form>
                    </div>
                  )}
                </>
              ),
            },
            {
              key: 'attendance',
              label: 'Attendance',
              children: progressLoading ? (
                <Skeleton active paragraph={{ rows: 3 }} />
              ) : progressData?.attendanceSummary ? (
                <div>
                  <div className="mb-4">
                    <Text type="secondary" className="text-sm">Attendance Rate</Text>
                    <Progress
                      percent={Math.round(progressData.attendanceSummary.attendanceRate || 0)}
                      size="small"
                      status={progressData.attendanceSummary.attendanceRate >= 75 ? 'success' : 'exception'}
                    />
                    <Text type="secondary" className="text-xs">
                      {progressData.attendanceSummary.attended}/{progressData.attendanceSummary.totalSessions} sessions attended
                    </Text>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-green-50 rounded text-center">
                      <div className="text-xl font-bold text-green-600">{progressData.attendanceSummary.attended}</div>
                      <Text type="secondary" className="text-xs">Present</Text>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded text-center">
                      <div className="text-xl font-bold text-yellow-600">{progressData.attendanceSummary.late}</div>
                      <Text type="secondary" className="text-xs">Late</Text>
                    </div>
                    <div className="p-3 bg-red-50 rounded text-center">
                      <div className="text-xl font-bold text-red-600">{progressData.attendanceSummary.absent}</div>
                      <Text type="secondary" className="text-xs">Absent</Text>
                    </div>
                    <div className="p-3 bg-blue-50 rounded text-center">
                      <div className="text-xl font-bold text-blue-600">{progressData.attendanceSummary.excused}</div>
                      <Text type="secondary" className="text-xs">Excused</Text>
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No attendance data"
                  description="Attendance data will appear here once sessions are completed."
                />
              ),
            },
          ]}
        />
      </Drawer>

      {/* Add Assignment Modal */}
      <Modal
        title="Add Assignment"
        open={addAssignmentModal}
        onCancel={() => { setAddAssignmentModal(false); assignmentForm.resetFields(); }}
        footer={null}
        destroyOnHidden
      >
        <Form
          form={assignmentForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!progressDrawer.enrollment) return;
            await createAssignment.mutateAsync({
              enrollmentId: progressDrawer.enrollment.enrollmentId,
              title: values.title,
              description: values.description || undefined,
              links: values.links ? values.links.split('\n').filter((l: string) => l.trim()) : undefined,
              dueDate: values.dueDate ? values.dueDate.toISOString() : undefined,
            });
            setAddAssignmentModal(false);
            assignmentForm.resetFields();
          }}
        >
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Title is required' }]}>
            <Input placeholder="Assignment title" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} placeholder="Assignment description or instructions..." />
          </Form.Item>

          <Form.Item name="links" label="Links (one per line)">
            <Input.TextArea rows={2} placeholder="https://example.com/resource" />
          </Form.Item>

          <Form.Item name="dueDate" label="Due Date">
            <DatePicker className="w-full" />
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => { setAddAssignmentModal(false); assignmentForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createAssignment.isPending}>
              Create Assignment
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
