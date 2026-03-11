'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import { useMyCertificates } from '@/hooks/usePortal';
import {
  DownloadOutlined,
  LinkOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Button, Card, Skeleton, Typography } from 'antd';

const { Text, Title } = Typography;

export default function CertificatesPage() {
  const { data: enrollments, isLoading } = useMyCertificates();

  const completedWithCert = (enrollments || []).filter((e) => e.certificateUrl || e.completionDate);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="My Certificates" subtitle="Your earned certificates and completions" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map((i) => <Card key={i}><Skeleton active paragraph={{ rows: 3 }} /></Card>)}
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="My Certificates"
        subtitle="Your earned certificates and program completions"
      />

      {completedWithCert.length === 0 ? (
        <EmptyState
          icon={<SafetyCertificateOutlined />}
          title="No certificates yet"
          description="Complete a program to earn your certificate. Your certificates will be available for download here."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completedWithCert.map((enrollment) => (
            <Card key={enrollment.enrollmentId} size="small" className="hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <SafetyCertificateOutlined className="text-2xl text-purple-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <Text strong className="text-base block">{enrollment.program?.name || 'Program'}</Text>
                  <Text type="secondary" className="text-sm">
                    {enrollment.cohort?.name || 'Cohort'}
                  </Text>
                  <div className="mt-1">
                    {enrollment.completionDate && (
                      <Text type="secondary" className="text-xs block">
                        Completed {new Date(enrollment.completionDate).toLocaleDateString()}
                      </Text>
                    )}
                    {enrollment.certificateIssuedAt && (
                      <Text type="secondary" className="text-xs block">
                        Issued {new Date(enrollment.certificateIssuedAt).toLocaleDateString()}
                      </Text>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    {enrollment.certificateUrl ? (
                      <>
                        <a href={enrollment.certificateUrl} target="_blank" rel="noopener noreferrer">
                          <Button type="primary" size="small" icon={<DownloadOutlined />}>
                            Download
                          </Button>
                        </a>
                        <Button
                          size="small"
                          icon={<LinkOutlined />}
                          onClick={() => {
                            navigator.clipboard.writeText(enrollment.certificateUrl!);
                          }}
                        >
                          Copy Link
                        </Button>
                      </>
                    ) : (
                      <Text type="secondary" className="text-sm italic">
                        Certificate is being prepared...
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
