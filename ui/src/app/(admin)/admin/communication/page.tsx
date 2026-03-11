'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import { useClients, useClientSearch } from '@/hooks/useClients';
import {
  useCommunications,
  useCreateTemplate,
  useDeleteTemplate,
  useInbox,
  usePreviewAudience,
  useSendBulkMessage,
  useSendMessage,
  useTemplates,
  useUpdateTemplate,
} from '@/hooks/useCommunications';
import { usePrograms } from '@/hooks/usePrograms';
import type { Communication, MessageMode, MessageTemplate, SendBulkMessageDto, SendMessageDto } from '@/types/communications';
import {
  ClientSegmentLabels,
  ClientStatusLabels,
  ClientTypeLabels,
  CommChannel,
  CommChannelColors,
  CommChannelLabels,
  CommStatus,
  CommStatusColors,
  CommStatusLabels,
} from '@/types/enums';
import {
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  MailOutlined,
  MessageOutlined,
  PlusOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Badge,
  Button,
  Card,
  Checkbox,
  Drawer,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Table,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useCallback, useMemo, useState } from 'react';

const { Text } = Typography;

const MODE_OPTIONS = [
  { value: 'individual', label: 'Individual', icon: <UserOutlined /> },
  { value: 'group', label: 'Group', icon: <TeamOutlined /> },
  { value: 'category', label: 'Category', icon: <InfoCircleOutlined /> },
  { value: 'broadcast', label: 'Broadcast', icon: <SendOutlined /> },
];

const TEMPLATE_CATEGORIES = [
  { value: 'enrollment', label: 'Enrollment' },
  { value: 'payment', label: 'Payment' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'notification', label: 'Notification' },
];

export default function CommunicationPage() {
  const [composeOpen, setComposeOpen] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [composeForm] = Form.useForm();
  const [templateForm] = Form.useForm();
  const [messageMode, setMessageMode] = useState<MessageMode>('individual');
  const [clientSearch, setClientSearch] = useState('');
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<CommChannel | undefined>();

  const { data: inboxData, isLoading: loadingInbox } = useInbox();
  const { data: sentData, isLoading: loadingSent } = useCommunications({ direction: 'outbound' as any });
  const { data: templates, isLoading: loadingTemplates } = useTemplates();
  const { data: searchResults, isLoading: searchingClients } = useClientSearch(clientSearch);
  const { data: initialClients, isLoading: loadingInitialClients } = useClients({ page: 1, limit: 50 });
  const { data: programsData } = usePrograms({ limit: 100 } as any);
  const sendMessage = useSendMessage();
  const sendBulkMessage = useSendBulkMessage();
  const previewAudience = usePreviewAudience();
  const createTemplate = useCreateTemplate();
  const updateTemplate = useUpdateTemplate();
  const deleteTemplate = useDeleteTemplate();

  const programs = programsData?.data || programsData || [];

  // Use search results if user is searching, otherwise show initial client list
  const displayClients = clientSearch.length >= 2
    ? (searchResults || [])
    : (initialClients?.data || []);

  const clientOptions = displayClients.map((c: any) => ({
    value: c.clientId,
    label: `${c.firstName} ${c.lastName}${c.email ? ` (${c.email})` : ''}`,
  }));

  // Filter templates by currently selected channel in compose form
  const filteredTemplates = useMemo(() => {
    if (!templates) return [];
    if (!selectedChannel) return templates;
    return templates.filter((t) => t.channel === selectedChannel);
  }, [templates, selectedChannel]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t) => t.templateId === templateId);
    if (template) {
      composeForm.setFieldsValue({
        subject: template.subject || '',
        body: template.body,
      });
    }
  };

  const handleSend = async (values: any) => {
    if (messageMode === 'individual' && values.clientIds?.length === 1) {
      // Single client — use original endpoint
      const dto: SendMessageDto = {
        clientId: values.clientIds[0],
        channel: values.channel,
        subject: values.subject,
        body: values.body,
        templateId: values.templateId,
      };
      await sendMessage.mutateAsync(dto);
    } else {
      // Bulk send
      const dto: SendBulkMessageDto = {
        channel: values.channel,
        subject: values.subject,
        body: values.body,
        templateId: values.templateId,
      };

      if (messageMode === 'individual' || messageMode === 'group') {
        dto.clientIds = values.clientIds;
      } else if (messageMode === 'category') {
        dto.filters = {
          statuses: values.filterStatuses,
          clientTypes: values.filterClientTypes,
          segments: values.filterSegments,
          countries: values.filterCountries,
          tags: values.filterTags,
          programIds: values.filterProgramIds,
        };
      } else if (messageMode === 'broadcast') {
        dto.filters = {
          marketingOptInOnly: values.marketingOptInOnly ?? false,
        };
      }

      await sendBulkMessage.mutateAsync(dto);
    }

    setComposeOpen(false);
    composeForm.resetFields();
    setAudienceCount(null);
    setMessageMode('individual');
    setSelectedChannel(undefined);
  };

  const handlePreviewAudience = useCallback(async () => {
    const values = composeForm.getFieldsValue();
    const dto: any = {};

    if (messageMode === 'individual' || messageMode === 'group') {
      dto.clientIds = values.clientIds;
    } else if (messageMode === 'category') {
      dto.filters = {
        statuses: values.filterStatuses,
        clientTypes: values.filterClientTypes,
        segments: values.filterSegments,
        countries: values.filterCountries,
        tags: values.filterTags,
        programIds: values.filterProgramIds,
      };
    } else if (messageMode === 'broadcast') {
      dto.filters = {
        marketingOptInOnly: values.marketingOptInOnly ?? false,
      };
    }

    const result = await previewAudience.mutateAsync(dto);
    setAudienceCount(result.count);
  }, [messageMode, composeForm, previewAudience]);

  const handleSaveTemplate = async (values: any) => {
    if (editingTemplate) {
      await updateTemplate.mutateAsync({ id: editingTemplate.templateId, data: values });
    } else {
      await createTemplate.mutateAsync(values);
    }
    setTemplateModalOpen(false);
    setEditingTemplate(null);
    templateForm.resetFields();
  };

  const openEditTemplateModal = (template: MessageTemplate) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue({
      name: template.name,
      channel: template.channel,
      category: template.category,
      subject: template.subject,
      body: template.body,
    });
    setTemplateModalOpen(true);
  };

  const handleComposeClose = () => {
    setComposeOpen(false);
    composeForm.resetFields();
    setAudienceCount(null);
    setMessageMode('individual');
    setClientSearch('');
    setSelectedChannel(undefined);
  };

  const channelColor = (channel: CommChannel) => CommChannelColors[channel] || 'default';

  const sharedColumns: ColumnsType<Communication> = [
    {
      title: 'Channel',
      dataIndex: 'channel',
      key: 'channel',
      width: 100,
      render: (ch: CommChannel) => <Tag color={channelColor(ch)}>{CommChannelLabels[ch]}</Tag>,
    },
    {
      title: 'Message',
      key: 'body',
      ellipsis: true,
      render: (_, record) => (
        <div>
          {record.subject && <Text strong className="text-sm">{record.subject} — </Text>}
          <Text type="secondary" className="text-sm">{record.body.substring(0, 100)}</Text>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      responsive: ['md'],
      render: (s: CommStatus) => <Tag color={CommStatusColors[s] || 'default'}>{CommStatusLabels[s] || s}</Tag>,
    },
    {
      title: 'Date',
      key: 'date',
      width: 120,
      responsive: ['lg'],
      render: (_, record) => new Date(record.createdAt).toLocaleDateString(),
    },
  ];

  const inboxColumns: ColumnsType<Communication> = [
    {
      title: 'From',
      key: 'from',
      render: (_, record) => record.client
        ? <Text strong>{record.client.firstName} {record.client.lastName}</Text>
        : <Text type="secondary">{record.fromAddress || 'Unknown'}</Text>,
    },
    ...sharedColumns,
  ];

  const sentColumns: ColumnsType<Communication> = [
    {
      title: 'To',
      key: 'to',
      render: (_, record) => record.client
        ? <Text strong>{record.client.firstName} {record.client.lastName}</Text>
        : <Text type="secondary">{record.toAddress || 'Unknown'}</Text>,
    },
    ...sharedColumns,
  ];

  const tabItems = [
    {
      key: 'inbox',
      label: (
        <span>
          Inbox
          {inboxData?.total ? <Badge count={inboxData.total} className="ml-2" size="small" /> : null}
        </span>
      ),
      children: (
        <Table
          dataSource={inboxData?.data || []}
          columns={inboxColumns}
          loading={loadingInbox}
          rowKey="communicationId"
          size="small"
          scroll={{ x: true }}
          pagination={{ total: inboxData?.total, pageSize: 20, showTotal: (t) => `${t} messages` }}
          locale={{ emptyText: <EmptyState icon={<MailOutlined />} title="Inbox empty" description="No inbound messages yet" /> }}
        />
      ),
    },
    {
      key: 'sent',
      label: 'Sent',
      children: (
        <Table
          dataSource={sentData?.data || []}
          columns={sentColumns}
          loading={loadingSent}
          rowKey="communicationId"
          size="small"
          scroll={{ x: true }}
          pagination={{ total: sentData?.total, pageSize: 20, showTotal: (t) => `${t} messages` }}
          locale={{ emptyText: <EmptyState icon={<SendOutlined />} title="No sent messages" description="Messages you send will appear here" /> }}
        />
      ),
    },
    {
      key: 'templates',
      label: 'Templates',
      children: (
        <div>
          <div className="flex justify-end mb-4">
            <Button icon={<PlusOutlined />} onClick={() => { setEditingTemplate(null); templateForm.resetFields(); setTemplateModalOpen(true); }}>
              Create Template
            </Button>
          </div>
          <List
            loading={loadingTemplates}
            dataSource={templates || []}
            locale={{ emptyText: <EmptyState icon={<MessageOutlined />} title="No templates" description="Create message templates for quick sending" actionLabel="Create Template" onAction={() => setTemplateModalOpen(true)} /> }}
            renderItem={(template) => (
              <List.Item
                key={template.templateId}
                actions={[
                  <Button key="edit" type="text" size="small" icon={<EditOutlined />} onClick={() => openEditTemplateModal(template)} />,
                  <Popconfirm key="delete" title="Delete this template?" onConfirm={() => deleteTemplate.mutate(template.templateId)}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <div className="flex items-center gap-2">
                      <Text strong>{template.name}</Text>
                      <Tag color={channelColor(template.channel)}>{CommChannelLabels[template.channel]}</Tag>
                      <Tag>{template.category}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      {template.subject && <Text className="text-sm block">Subject: {template.subject}</Text>}
                      <Text type="secondary" className="text-sm" ellipsis>
                        {template.body.substring(0, 120)}...
                      </Text>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </div>
      ),
    },
  ];

  const isSending = sendMessage.isPending || sendBulkMessage.isPending;

  return (
    <>
      <PageHeader
        title="Communication"
        subtitle="Manage messages and templates"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Communication' }]}
        actions={
          <Button type="primary" icon={<SendOutlined />} onClick={() => setComposeOpen(true)}>
            Compose
          </Button>
        }
      />

      <Tabs items={tabItems} />

      {/* Compose Drawer */}
      <Drawer
        title="Compose Message"
        open={composeOpen}
        onClose={handleComposeClose}
        width={520}
        destroyOnHidden
      >
        <div className="mb-4">
          <Segmented
            block
            value={messageMode}
            onChange={(val) => {
              setMessageMode(val as MessageMode);
              setAudienceCount(null);
            }}
            options={MODE_OPTIONS}
          />
        </div>

        <Form form={composeForm} layout="vertical" onFinish={handleSend}>
          {/* ─── Individual / Group: Client multi-select ─── */}
          {(messageMode === 'individual' || messageMode === 'group') && (
            <Form.Item
              name="clientIds"
              label={messageMode === 'individual' ? 'Recipient' : 'Recipients'}
              rules={[{ required: true, message: 'Select at least one client' }]}
            >
              <Select
                mode="multiple"
                placeholder="Search clients by name or email..."
                showSearch
                filterOption={false}
                onSearch={setClientSearch}
                loading={searchingClients || loadingInitialClients}
                options={clientOptions}
                notFoundContent={
                  (searchingClients || loadingInitialClients)
                    ? 'Loading clients...'
                    : 'No clients found'
                }
              />
            </Form.Item>
          )}

          {/* ─── Category: Filter fields ─── */}
          {messageMode === 'category' && (
            <Card size="small" className="mb-4" title="Audience Filters">
              <Form.Item name="filterStatuses" label="Status" className="mb-3">
                <Select
                  mode="multiple"
                  placeholder="Any status"
                  allowClear
                  options={Object.entries(ClientStatusLabels).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
              <Form.Item name="filterClientTypes" label="Client Type" className="mb-3">
                <Select
                  mode="multiple"
                  placeholder="Any type"
                  allowClear
                  options={Object.entries(ClientTypeLabels).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
              <Form.Item name="filterSegments" label="Segment" className="mb-3">
                <Select
                  mode="multiple"
                  placeholder="Any segment"
                  allowClear
                  options={Object.entries(ClientSegmentLabels).map(([value, label]) => ({ value, label }))}
                />
              </Form.Item>
              <Form.Item name="filterCountries" label="Country" className="mb-3">
                <Select
                  mode="tags"
                  placeholder="Type country codes (e.g. KE, US)"
                  allowClear
                />
              </Form.Item>
              <Form.Item name="filterProgramIds" label="Enrolled in Program" className="mb-3">
                <Select
                  mode="multiple"
                  placeholder="Any program"
                  allowClear
                  options={(Array.isArray(programs) ? programs : []).map((p: any) => ({
                    value: p.programId,
                    label: `${p.code} — ${p.name}`,
                  }))}
                />
              </Form.Item>
              <Form.Item name="filterTags" label="Tags" className="mb-3">
                <Select mode="tags" placeholder="Type tags and press Enter" allowClear />
              </Form.Item>

              <Button
                onClick={handlePreviewAudience}
                loading={previewAudience.isPending}
                block
              >
                Preview Audience
              </Button>
              {audienceCount !== null && (
                <Alert
                  type="info"
                  showIcon
                  className="mt-2"
                  message={`This message will reach ${audienceCount} client${audienceCount !== 1 ? 's' : ''}`}
                />
              )}
            </Card>
          )}

          {/* ─── Broadcast: marketing opt-in toggle ─── */}
          {messageMode === 'broadcast' && (
            <Card size="small" className="mb-4">
              <Alert
                type="warning"
                showIcon
                className="mb-3"
                message="Broadcast sends to all clients"
                description="This will send a message to every client in the system. Use the marketing opt-in filter to respect client preferences."
              />
              <Form.Item name="marketingOptInOnly" valuePropName="checked" className="mb-3">
                <Checkbox>Only clients who opted in to marketing</Checkbox>
              </Form.Item>

              <Button
                onClick={handlePreviewAudience}
                loading={previewAudience.isPending}
                block
              >
                Preview Audience
              </Button>
              {audienceCount !== null && (
                <Alert
                  type="info"
                  showIcon
                  className="mt-2"
                  message={`This broadcast will reach ${audienceCount} client${audienceCount !== 1 ? 's' : ''}`}
                />
              )}
            </Card>
          )}

          {/* ─── Common fields: channel, template, subject, body ─── */}
          <Form.Item name="channel" label="Channel" rules={[{ required: true, message: 'Required' }]}>
            <Select
              placeholder="Select channel"
              options={Object.entries(CommChannelLabels).map(([value, label]) => ({ value, label }))}
              onChange={(val) => {
                setSelectedChannel(val as CommChannel);
                composeForm.setFieldValue('templateId', undefined);
              }}
            />
          </Form.Item>

          <Form.Item name="templateId" label="Template (optional)">
            <Select
              placeholder={selectedChannel ? 'Select a template to auto-fill' : 'Select a channel first'}
              allowClear
              disabled={!selectedChannel}
              onChange={(val) => { if (val) handleTemplateSelect(val); }}
              options={filteredTemplates.map((t) => ({
                value: t.templateId,
                label: `${t.name} (${t.category})`,
              }))}
              notFoundContent={
                !selectedChannel
                  ? 'Select a channel first'
                  : 'No templates for this channel'
              }
            />
          </Form.Item>

          <Form.Item name="subject" label="Subject">
            <Input placeholder="Email subject (optional for SMS/WhatsApp)" />
          </Form.Item>
          <Form.Item name="body" label="Message" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea
              rows={6}
              placeholder="Type your message... Use {{client.firstName}}, {{client.lastName}}, {{client.fullName}} for personalization"
            />
          </Form.Item>

          <Alert
            type="info"
            showIcon
            className="mb-4"
            message="Personalization variables"
            description="Use {{client.firstName}}, {{client.lastName}}, {{client.fullName}}, {{client.email}}, {{client.phone}} — these will be replaced with each recipient's data."
          />

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleComposeClose}>Cancel</Button>
            <Button type="primary" icon={<SendOutlined />} htmlType="submit" loading={isSending}>
              {messageMode === 'broadcast' ? 'Send Broadcast' : 'Send'}
            </Button>
          </div>
        </Form>
      </Drawer>

      {/* Create / Edit Template Modal */}
      <Modal
        title={editingTemplate ? `Edit Template: ${editingTemplate.name}` : 'Create Template'}
        open={templateModalOpen}
        onCancel={() => { setTemplateModalOpen(false); setEditingTemplate(null); templateForm.resetFields(); }}
        footer={null}
        width={600}
        destroyOnHidden
      >
        <Form form={templateForm} layout="vertical" onFinish={handleSaveTemplate} className="mt-4">
          <Form.Item name="name" label="Template Name" rules={[{ required: true, message: 'Required' }]}>
            <Input placeholder="e.g., enrollment_confirmation" />
          </Form.Item>
          <div className="grid grid-cols-2 gap-x-4">
            <Form.Item name="channel" label="Channel" rules={[{ required: true, message: 'Required' }]}>
              <Select
                placeholder="Select channel"
                options={Object.entries(CommChannelLabels).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Required' }]}>
              <Select placeholder="Select category" options={TEMPLATE_CATEGORIES} />
            </Form.Item>
          </div>
          <Form.Item name="subject" label="Subject">
            <Input placeholder="Email subject (supports {{variables}})" />
          </Form.Item>
          <Form.Item name="body" label="Body" rules={[{ required: true, message: 'Required' }]}>
            <Input.TextArea rows={6} placeholder="Message body — use {{client.firstName}}, {{client.lastName}}, {{client.fullName}} for personalization" />
          </Form.Item>
          <Alert
            type="info"
            showIcon
            className="mb-4"
            message="Available variables: {{client.firstName}}, {{client.lastName}}, {{client.fullName}}, {{client.email}}, {{client.phone}}"
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => { setTemplateModalOpen(false); setEditingTemplate(null); templateForm.resetFields(); }}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={createTemplate.isPending || updateTemplate.isPending}>
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
