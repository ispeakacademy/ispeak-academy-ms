'use client';

import EmptyState from '@/components/admin/EmptyState';
import StatusTag from '@/components/admin/StatusTag';
import { useAuth } from '@/contexts/AuthContext';
import { useMyEnrollments, useMyInvoices, useMySessions } from '@/hooks/usePortal';
import { EnrollmentStatus, InvoiceStatus } from '@/types/enums';
import {
  CalendarOutlined,
  DollarOutlined,
  FileTextOutlined,
  ReadOutlined,
  SafetyCertificateOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import { Card, Col, Progress, Row, Skeleton, Statistic, Table, Typography } from 'antd';
import Link from 'next/link';

const { Text, Title } = Typography;

export default function PortalDashboard() {
  const { user } = useAuth();
  const { data: enrollments, isLoading: loadingEnrollments } = useMyEnrollments(1, 5);
  const { data: invoices, isLoading: loadingInvoices } = useMyInvoices(1, 5);
  const { data: sessions, isLoading: loadingSessions } = useMySessions();

  const activeEnrollments = enrollments?.data?.filter(
    (e) => e.status === EnrollmentStatus.ACTIVE || e.status === EnrollmentStatus.CONFIRMED
  ) || [];

  const outstandingInvoices = invoices?.data?.filter(
    (inv) => inv.status !== InvoiceStatus.PAID && inv.status !== InvoiceStatus.VOID
  ) || [];

  const outstandingBalance = outstandingInvoices.reduce(
    (sum, inv) => sum + Number(inv.balance || 0), 0
  );

  const upcomingSessions = (sessions || [])
    .filter((s) => new Date(s.scheduledAt) > new Date())
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, 3);

  return (
    <div>
      {/* Welcome Banner */}
      <Card className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 border-0">
        <div className="text-white">
          <Title level={3} className="!text-white !mb-1">
            Welcome back, {user?.firstName}!
          </Title>
          <Text className="text-blue-100">
            Here&apos;s an overview of your learning journey at iSpeak Academy.
          </Text>
        </div>
      </Card>

      {/* Quick Stats */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Link href="/portal/programs">
              <Statistic
                title="Active Programs"
                value={activeEnrollments.length}
                prefix={<ReadOutlined className="text-blue-500" />}
                loading={loadingEnrollments}
              />
            </Link>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Link href="/portal/sessions">
              <Statistic
                title="Upcoming Sessions"
                value={upcomingSessions.length}
                prefix={<CalendarOutlined className="text-green-500" />}
                loading={loadingSessions}
              />
            </Link>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Link href="/portal/invoices">
              <Statistic
                title="Outstanding"
                value={outstandingBalance}
                prefix={<DollarOutlined className="text-orange-500" />}
                suffix="KES"
                loading={loadingInvoices}
                valueStyle={outstandingBalance > 0 ? { color: '#f5222d' } : undefined}
              />
            </Link>
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card size="small" hoverable>
            <Link href="/portal/certificates">
              <Statistic
                title="Certificates"
                value={enrollments?.data?.filter((e) => e.certificateUrl).length || 0}
                prefix={<SafetyCertificateOutlined className="text-purple-500" />}
                loading={loadingEnrollments}
              />
            </Link>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Active Program Progress */}
        <Col xs={24} lg={12}>
          <Card
            title="Active Programs"
            size="small"
            extra={<Link href="/portal/programs" className="text-blue-600 text-sm">View all</Link>}
          >
            {loadingEnrollments ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : activeEnrollments.length > 0 ? (
              <div className="space-y-4">
                {activeEnrollments.slice(0, 3).map((enrollment) => (
                  <div key={enrollment.enrollmentId} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <Text strong>{enrollment.program?.name || 'Program'}</Text>
                        <br />
                        <Text type="secondary" className="text-xs">
                          {enrollment.cohort?.name || 'Cohort'}
                        </Text>
                      </div>
                      <StatusTag type="enrollment" status={enrollment.status} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Text type="secondary" className="text-xs w-12">{enrollment.progressPercent}%</Text>
                      <Progress
                        percent={enrollment.progressPercent}
                        size="small"
                        className="flex-1"
                        showInfo={false}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<ReadOutlined />}
                title="No active programs"
                description="You're not currently enrolled in any programs"
              />
            )}
          </Card>
        </Col>

        {/* Upcoming Sessions */}
        <Col xs={24} lg={12}>
          <Card
            title="Upcoming Sessions"
            size="small"
            extra={<Link href="/portal/sessions" className="text-blue-600 text-sm">View all</Link>}
          >
            {loadingSessions ? (
              <Skeleton active paragraph={{ rows: 3 }} />
            ) : upcomingSessions.length > 0 ? (
              <div className="space-y-3">
                {upcomingSessions.map((session) => {
                  const sessionDate = new Date(session.scheduledAt);
                  const isToday = sessionDate.toDateString() === new Date().toDateString();
                  return (
                    <div key={session.sessionId} className={`border rounded-lg p-3 ${isToday ? 'border-blue-300 bg-blue-50' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <Text strong>{session.title}</Text>
                          {isToday && <span className="ml-2 text-xs text-blue-600 font-medium">TODAY</span>}
                          <br />
                          <Text type="secondary" className="text-xs">
                            {sessionDate.toLocaleDateString()} at {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            {' '}({session.durationMinutes} min)
                          </Text>
                        </div>
                        {session.meetingLink && (
                          <a
                            href={session.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-sm font-medium"
                          >
                            Join
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarOutlined />}
                title="No upcoming sessions"
                description="Your next sessions will appear here"
              />
            )}
          </Card>
        </Col>
      </Row>

      {/* Quick Links */}
      <Card title="Quick Links" size="small" className="mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link href="/portal/certificates" className="text-center p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <SafetyCertificateOutlined className="text-2xl text-purple-500" />
            <div className="text-sm mt-2 font-medium">Certificates</div>
          </Link>
          <Link href="/portal/referrals" className="text-center p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <ShareAltOutlined className="text-2xl text-green-500" />
            <div className="text-sm mt-2 font-medium">Refer a Friend</div>
          </Link>
          <Link href="/portal/invoices" className="text-center p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <FileTextOutlined className="text-2xl text-orange-500" />
            <div className="text-sm mt-2 font-medium">My Invoices</div>
          </Link>
          <Link href="/portal/profile" className="text-center p-4 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
            <CalendarOutlined className="text-2xl text-blue-500" />
            <div className="text-sm mt-2 font-medium">My Profile</div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
