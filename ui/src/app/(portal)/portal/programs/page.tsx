'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import StatusTag from '@/components/admin/StatusTag';
import { useMyEnrollments, useMyEnrollmentProgress } from '@/hooks/usePortal';
import type { Enrollment } from '@/types/enrollments';
import { EnrollmentStatusLabels, ProgressStatusLabels } from '@/types/enums';
import {
  BookOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  FormOutlined,
  ReadOutlined,
} from '@ant-design/icons';
import { Badge, Card, List, Modal, Progress, Skeleton, Steps, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

const { Text, Title } = Typography;

function ProgressModal({ enrollment, open, onClose }: { enrollment: Enrollment | null; open: boolean; onClose: () => void }) {
  const { data: progress, isLoading } = useMyEnrollmentProgress(enrollment?.enrollmentId || '', open);

  const modules = progress?.modules || progress || [];

  return (
    <Modal
      title={`Progress — ${enrollment?.program?.name || 'Program'}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
    >
      {isLoading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : Array.isArray(modules) && modules.length > 0 ? (
        <>
          {progress?.progressPercent !== undefined && (
            <div className="mb-4">
              <Text type="secondary" className="text-sm">Overall Progress</Text>
              <Progress percent={Math.round(Number(progress.progressPercent) || 0)} size="small" />
            </div>
          )}
          <List
            dataSource={modules}
            renderItem={(mod, index) => (
              <List.Item key={mod.moduleProgressId}>
                <List.Item.Meta
                  avatar={
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      mod.status === 'completed' ? 'bg-green-100 text-green-600' :
                      mod.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
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
                        {ProgressStatusLabels[mod.status as keyof typeof ProgressStatusLabels] || mod.status}
                      </Tag>
                      {mod.module?.isOptional && <Tag>Optional</Tag>}
                    </div>
                  }
                  description={
                    <div>
                      {mod.module?.description && (
                        <Text type="secondary" className="text-sm">{mod.module.description}</Text>
                      )}
                      {mod.module?.estimatedHours && (
                        <div className="mt-1">
                          <Text type="secondary" className="text-xs">
                            <ClockCircleOutlined className="mr-1" />
                            {mod.module.estimatedHours} hours
                          </Text>
                        </div>
                      )}
                      {mod.score !== null && mod.score !== undefined && (
                        <div className="mt-1">
                          <Text type="secondary" className="text-sm">Score: {mod.score}%</Text>
                        </div>
                      )}
                      {mod.trainerFeedback && (
                        <div className="mt-1">
                          <Text type="secondary" className="text-xs italic">&ldquo;{mod.trainerFeedback}&rdquo;</Text>
                        </div>
                      )}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        </>
      ) : (
        <EmptyState title="No module progress data" description="Progress tracking will appear here once modules are set up" />
      )}
    </Modal>
  );
}

export default function MyProgramsPage() {
  const { data, isLoading } = useMyEnrollments(1, 50);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [progressOpen, setProgressOpen] = useState(false);

  const enrollments = data?.data || [];
  const active = enrollments.filter((e) => ['active', 'confirmed', 'approved'].includes(e.status));
  const completed = enrollments.filter((e) => e.status === 'completed');
  const other = enrollments.filter((e) => !['active', 'confirmed', 'approved', 'completed'].includes(e.status));

  const renderEnrollmentCard = (enrollment: Enrollment) => (
    <Card
      key={enrollment.enrollmentId}
      size="small"
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => { setSelectedEnrollment(enrollment); setProgressOpen(true); }}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <Text strong className="text-base">{enrollment.program?.name || 'Program'}</Text>
          <br />
          <Text type="secondary" className="text-sm">
            {enrollment.cohort?.name || 'Cohort'} {enrollment.cohort?.batchCode ? `(${enrollment.cohort.batchCode})` : ''}
          </Text>
        </div>
        <StatusTag type="enrollment" status={enrollment.status} />
      </div>

      <Progress
        percent={Math.round(Number(enrollment.progressPercent) || 0)}
        size="small"
        status={enrollment.status === 'completed' ? 'success' : 'active'}
      />

      <div className="flex justify-between mt-3 text-xs">
        <Text type="secondary">
          <ClockCircleOutlined className="mr-1" />
          Enrolled {new Date(enrollment.createdAt).toLocaleDateString()}
        </Text>
        {enrollment.completionDate && (
          <Text type="success">
            <CheckCircleOutlined className="mr-1" />
            Completed {new Date(enrollment.completionDate).toLocaleDateString()}
          </Text>
        )}
      </div>

      {(enrollment as any).assignmentSummary?.pending > 0 && (
        <div className="mt-2 pt-2 border-t">
          <Badge
            count={`${(enrollment as any).assignmentSummary.pending} assignment${(enrollment as any).assignmentSummary.pending > 1 ? 's' : ''} pending`}
            color="orange"
            className="text-xs"
          />
        </div>
      )}

      {enrollment.certificateUrl && (
        <div className="mt-2 pt-2 border-t">
          <a
            href={enrollment.certificateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 text-sm"
            onClick={(e) => e.stopPropagation()}
          >
            Download Certificate
          </a>
        </div>
      )}
    </Card>
  );

  if (isLoading) {
    return (
      <div>
        <PageHeader title="My Programs" subtitle="Your enrolled programs and progress" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Card key={i}><Skeleton active paragraph={{ rows: 3 }} /></Card>)}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="My Programs"
        subtitle="Your enrolled programs and learning progress"
      />

      {enrollments.length === 0 ? (
        <EmptyState
          icon={<ReadOutlined />}
          title="No programs yet"
          description="You haven't enrolled in any programs. Contact iSpeak Academy to get started!"
        />
      ) : (
        <div className="space-y-6">
          {/* Active Programs */}
          {active.length > 0 && (
            <div>
              <Title level={5} className="!mb-3">Active Programs</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {active.map(renderEnrollmentCard)}
              </div>
            </div>
          )}

          {/* Completed Programs */}
          {completed.length > 0 && (
            <div>
              <Title level={5} className="!mb-3">Completed</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completed.map(renderEnrollmentCard)}
              </div>
            </div>
          )}

          {/* Other */}
          {other.length > 0 && (
            <div>
              <Title level={5} className="!mb-3">Other</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {other.map(renderEnrollmentCard)}
              </div>
            </div>
          )}
        </div>
      )}

      <ProgressModal
        enrollment={selectedEnrollment}
        open={progressOpen}
        onClose={() => { setProgressOpen(false); setSelectedEnrollment(null); }}
      />
    </>
  );
}
