'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import { useMyAssignments, useSubmitAssignment } from '@/hooks/useAssignments';
import { uploadImage } from '@/lib/api/upload.api';
import { getSignedUrl } from '@/lib/api/upload.api';
import type { Assignment, AssignmentSubmission } from '@/types/assignments';
import { SubmissionStatus } from '@/types/assignments';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  CloudUploadOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LinkOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Drawer, Form, Input, Modal, Skeleton, Space, Tag, Typography, Upload } from 'antd';
import type { UploadFile } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useMemo, useState } from 'react';

dayjs.extend(relativeTime);

const { Text, Title, Paragraph } = Typography;

const statusConfig: Record<string, { color: string; label: string }> = {
  pending: { color: 'default', label: 'Pending' },
  submitted: { color: 'processing', label: 'Submitted' },
  reviewed: { color: 'success', label: 'Reviewed' },
  revision_requested: { color: 'warning', label: 'Revision Requested' },
};

const tabs = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'submitted', label: 'Submitted' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'revision_requested', label: 'Revision' },
];

function getSubmissionStatus(assignment: Assignment): string {
  const submission = assignment.submissions?.[0];
  if (!submission) return 'pending';
  return submission.status;
}

function isOverdue(assignment: Assignment): boolean {
  if (!assignment.dueDate) return false;
  const status = getSubmissionStatus(assignment);
  if (status === 'reviewed') return false;
  return dayjs(assignment.dueDate).isBefore(dayjs());
}

export default function PortalAssignmentsPage() {
  const { data: assignments, isLoading } = useMyAssignments();
  const submitAssignment = useSubmitAssignment();
  const [activeTab, setActiveTab] = useState('all');
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<{ key: string; name: string }[]>([]);

  const filtered = useMemo(() => {
    if (!assignments) return [];
    if (activeTab === 'all') return assignments;
    return assignments.filter((a) => getSubmissionStatus(a) === activeTab);
  }, [assignments, activeTab]);

  const handleOpenDetail = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setDrawerOpen(true);
  };

  const handleOpenSubmit = () => {
    setSubmitModalOpen(true);
    setUploadedFiles([]);
    form.resetFields();
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const result = await uploadImage(file);
      if (result) {
        setUploadedFiles((prev) => [...prev, { key: result.key, name: file.name }]);
      }
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (values: any) => {
    if (!selectedAssignment) return;
    await submitAssignment.mutateAsync({
      assignmentId: selectedAssignment.assignmentId,
      data: {
        notes: values.notes || undefined,
        attachmentUrls: uploadedFiles.map((f) => f.key),
      },
    });
    setSubmitModalOpen(false);
    setDrawerOpen(false);
    form.resetFields();
    setUploadedFiles([]);
  };

  const handleDownload = async (key: string) => {
    const result = await getSignedUrl(key);
    if (result?.url) {
      window.open(result.url, '_blank');
    }
  };

  const submission: AssignmentSubmission | undefined = selectedAssignment?.submissions?.[0];
  const canSubmit = submission && ['pending', 'revision_requested'].includes(submission.status);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Assignments" subtitle="Your tasks and submissions" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => <Card key={i}><Skeleton active paragraph={{ rows: 3 }} /></Card>)}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Assignments"
        subtitle="View and submit your assignments"
      />

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((tab) => (
          <Button
            key={tab.key}
            type={activeTab === tab.key ? 'primary' : 'default'}
            size="small"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key !== 'all' && assignments && (
              <Badge
                count={assignments.filter((a) => tab.key === 'all' ? true : getSubmissionStatus(a) === tab.key).length}
                size="small"
                className="ml-1"
                showZero={false}
              />
            )}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileTextOutlined />}
          title="No assignments"
          description={activeTab !== 'all' ? `No ${activeTab.replace('_', ' ')} assignments` : 'No assignments found'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((assignment) => {
            const status = getSubmissionStatus(assignment);
            const overdue = isOverdue(assignment);
            return (
              <Card
                key={assignment.assignmentId}
                size="small"
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpenDetail(assignment)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <Text strong className="text-base line-clamp-1">{assignment.title}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {assignment.enrollment?.program?.name || 'Program'}
                    </Text>
                  </div>
                  <Tag color={statusConfig[status]?.color || 'default'}>
                    {statusConfig[status]?.label || status}
                  </Tag>
                </div>

                {assignment.description && (
                  <Text type="secondary" className="text-sm line-clamp-2 mb-2 block">
                    {assignment.description}
                  </Text>
                )}

                <div className="flex items-center justify-between mt-2 text-xs">
                  {assignment.dueDate ? (
                    <Text type={overdue ? 'danger' : 'secondary'}>
                      <CalendarOutlined className="mr-1" />
                      {overdue ? 'Overdue: ' : 'Due: '}
                      {dayjs(assignment.dueDate).format('MMM D, YYYY')}
                    </Text>
                  ) : (
                    <Text type="secondary">No due date</Text>
                  )}
                  {assignment.attachmentUrls?.length > 0 && (
                    <Text type="secondary">
                      <PaperClipOutlined className="mr-1" />
                      {assignment.attachmentUrls.length} file{assignment.attachmentUrls.length > 1 ? 's' : ''}
                    </Text>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assignment Detail Drawer */}
      <Drawer
        title={selectedAssignment?.title || 'Assignment'}
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setSelectedAssignment(null); }}
        width={560}
        destroyOnHidden
        extra={
          canSubmit && (
            <Button type="primary" onClick={handleOpenSubmit}>
              {submission?.status === 'revision_requested' ? 'Resubmit' : 'Submit'}
            </Button>
          )
        }
      >
        {selectedAssignment && (
          <div className="space-y-4">
            {/* Meta info */}
            <div className="flex flex-wrap gap-2">
              <Tag color={statusConfig[getSubmissionStatus(selectedAssignment)]?.color || 'default'}>
                {statusConfig[getSubmissionStatus(selectedAssignment)]?.label}
              </Tag>
              {selectedAssignment.enrollment?.program && (
                <Tag>{selectedAssignment.enrollment.program.name}</Tag>
              )}
              {selectedAssignment.dueDate && (
                <Tag
                  icon={<CalendarOutlined />}
                  color={isOverdue(selectedAssignment) ? 'error' : 'default'}
                >
                  {dayjs(selectedAssignment.dueDate).format('MMM D, YYYY')}
                </Tag>
              )}
            </div>

            {/* Description */}
            {selectedAssignment.description && (
              <div>
                <Text strong className="block mb-1">Description</Text>
                <Paragraph className="whitespace-pre-wrap text-sm">{selectedAssignment.description}</Paragraph>
              </div>
            )}

            {/* Links */}
            {selectedAssignment.links?.length > 0 && (
              <div>
                <Text strong className="block mb-1">Links</Text>
                <div className="space-y-1">
                  {selectedAssignment.links.map((link, i) => (
                    <a
                      key={i}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
                    >
                      <LinkOutlined />
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Attachments */}
            {selectedAssignment.attachmentUrls?.length > 0 && (
              <div>
                <Text strong className="block mb-1">Attachments</Text>
                <div className="space-y-1">
                  {selectedAssignment.attachmentUrls.map((key, i) => (
                    <Button
                      key={i}
                      type="link"
                      size="small"
                      icon={<PaperClipOutlined />}
                      onClick={() => handleDownload(key)}
                    >
                      Attachment {i + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Submission Details */}
            {submission && submission.status !== 'pending' && (
              <div className="border-t pt-4">
                <Text strong className="block mb-2">Your Submission</Text>

                {submission.notes && (
                  <div className="mb-2">
                    <Text type="secondary" className="text-xs">Notes:</Text>
                    <Paragraph className="text-sm whitespace-pre-wrap">{submission.notes}</Paragraph>
                  </div>
                )}

                {submission.attachmentUrls?.length > 0 && (
                  <div className="mb-2">
                    <Text type="secondary" className="text-xs block mb-1">Submitted Files:</Text>
                    {submission.attachmentUrls.map((key, i) => (
                      <Button
                        key={i}
                        type="link"
                        size="small"
                        icon={<PaperClipOutlined />}
                        onClick={() => handleDownload(key)}
                      >
                        File {i + 1}
                      </Button>
                    ))}
                  </div>
                )}

                {submission.submittedAt && (
                  <Text type="secondary" className="text-xs block">
                    <ClockCircleOutlined className="mr-1" />
                    Submitted {dayjs(submission.submittedAt).fromNow()}
                  </Text>
                )}
              </div>
            )}

            {/* Review Feedback */}
            {submission && (submission.status === 'reviewed' || submission.status === 'revision_requested') && (
              <div className="border-t pt-4">
                <Text strong className="block mb-2">Trainer Feedback</Text>
                {submission.reviewerFeedback && (
                  <Paragraph className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded">
                    {submission.reviewerFeedback}
                  </Paragraph>
                )}
                {submission.score !== null && submission.score !== undefined && (
                  <Text className="text-sm block mt-1">Score: <Text strong>{submission.score}%</Text></Text>
                )}
                {submission.reviewedAt && (
                  <Text type="secondary" className="text-xs block mt-1">
                    Reviewed {dayjs(submission.reviewedAt).fromNow()}
                  </Text>
                )}
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Submit Modal */}
      <Modal
        title={submission?.status === 'revision_requested' ? 'Resubmit Assignment' : 'Submit Assignment'}
        open={submitModalOpen}
        onCancel={() => { setSubmitModalOpen(false); setUploadedFiles([]); form.resetFields(); }}
        footer={null}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="notes" label="Notes (optional)">
            <Input.TextArea rows={4} placeholder="Add any notes or comments for your trainer..." />
          </Form.Item>

          <div className="mb-4">
            <Text strong className="block mb-2">Attachments</Text>
            <Upload.Dragger
              beforeUpload={(file) => {
                handleFileUpload(file);
                return false;
              }}
              showUploadList={false}
              multiple
            >
              <p className="text-gray-400">
                <CloudUploadOutlined className="text-2xl" />
              </p>
              <p className="text-sm text-gray-600">Click or drag files to upload</p>
            </Upload.Dragger>

            {uploadedFiles.length > 0 && (
              <div className="mt-2 space-y-1">
                {uploadedFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 px-3 py-1 rounded text-sm">
                    <span className="truncate flex-1">{file.name}</span>
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i))}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button onClick={() => { setSubmitModalOpen(false); setUploadedFiles([]); form.resetFields(); }}>Cancel</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitAssignment.isPending || uploading}
            >
              Submit
            </Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
