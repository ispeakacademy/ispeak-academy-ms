'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import { useMySessions } from '@/hooks/usePortal';
import { DeliveryModeLabels, SessionStatusLabels } from '@/types/enums';
import type { Session } from '@/types/cohorts';
import {
  CalendarOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { Badge, Button, Card, Skeleton, Tabs, Tag, Typography } from 'antd';

const { Text } = Typography;

function SessionCard({ session }: { session: Session }) {
  const sessionDate = new Date(session.scheduledAt);
  const now = new Date();
  const isToday = sessionDate.toDateString() === now.toDateString();
  const isPast = sessionDate < now;
  const isJoinable = !isPast && sessionDate.getTime() - now.getTime() < 15 * 60 * 1000; // 15 min before

  return (
    <Card
      size="small"
      className={`${isToday ? 'border-blue-300 bg-blue-50/50' : ''} ${isPast ? 'opacity-75' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Text strong>{session.title}</Text>
            {isToday && <Tag color="blue">TODAY</Tag>}
            <Tag>{SessionStatusLabels[session.status as keyof typeof SessionStatusLabels] || session.status}</Tag>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1">
            <Text type="secondary" className="text-sm">
              <CalendarOutlined className="mr-1" />
              {sessionDate.toLocaleDateString()} at{' '}
              {sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Text>
            <Text type="secondary" className="text-sm">
              {session.durationMinutes} min
            </Text>
            <Tag className="text-xs">
              {DeliveryModeLabels[session.mode as keyof typeof DeliveryModeLabels] || session.mode}
            </Tag>
          </div>
          {session.venue && (
            <Text type="secondary" className="text-sm mt-1 block">
              <EnvironmentOutlined className="mr-1" />
              {session.venue}
            </Text>
          )}
          {session.description && (
            <Text type="secondary" className="text-sm mt-1 block">{session.description}</Text>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {session.meetingLink && !isPast && (
            <a href={session.meetingLink} target="_blank" rel="noopener noreferrer">
              <Button
                type={isJoinable ? 'primary' : 'default'}
                icon={<VideoCameraOutlined />}
                size="small"
              >
                {isJoinable ? 'Join Now' : 'Meeting Link'}
              </Button>
            </a>
          )}
          {session.recordingUrl && (
            <a href={session.recordingUrl} target="_blank" rel="noopener noreferrer">
              <Button icon={<PlayCircleOutlined />} size="small">
                Recording
              </Button>
            </a>
          )}
          {session.materialsUrl && (
            <a href={session.materialsUrl} target="_blank" rel="noopener noreferrer">
              <Button icon={<LinkOutlined />} size="small" type="text">
                Materials
              </Button>
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function SessionsPage() {
  const { data: sessions, isLoading } = useMySessions();

  const allSessions = sessions || [];
  const now = new Date();
  const upcoming = allSessions
    .filter((s) => new Date(s.scheduledAt) >= now && s.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  const past = allSessions
    .filter((s) => new Date(s.scheduledAt) < now || s.status === 'completed')
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Sessions" subtitle="Your class schedule" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Card key={i}><Skeleton active paragraph={{ rows: 2 }} /></Card>)}
        </div>
      </div>
    );
  }

  const tabItems = [
    {
      key: 'upcoming',
      label: (
        <span>
          Upcoming
          {upcoming.length > 0 && <Badge count={upcoming.length} className="ml-2" size="small" />}
        </span>
      ),
      children: upcoming.length > 0 ? (
        <div className="space-y-3">
          {upcoming.map((session) => (
            <SessionCard key={session.sessionId} session={session} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarOutlined />}
          title="No upcoming sessions"
          description="Your upcoming class sessions will appear here once scheduled"
        />
      ),
    },
    {
      key: 'past',
      label: `Past (${past.length})`,
      children: past.length > 0 ? (
        <div className="space-y-3">
          {past.map((session) => (
            <SessionCard key={session.sessionId} session={session} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<CalendarOutlined />}
          title="No past sessions"
          description="Your session history will appear here"
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Sessions"
        subtitle="Your class schedule and session history"
      />
      <Tabs items={tabItems} defaultActiveKey="upcoming" />
    </>
  );
}
