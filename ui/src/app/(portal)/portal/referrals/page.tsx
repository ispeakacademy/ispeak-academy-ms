'use client';

import EmptyState from '@/components/admin/EmptyState';
import PageHeader from '@/components/admin/PageHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useMyReferrals } from '@/hooks/usePortal';
import {
  CopyOutlined,
  GiftOutlined,
  ShareAltOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import { Button, Card, Input, message, Skeleton, Steps, Table, Tag, Typography } from 'antd';
import { useState } from 'react';

const { Text, Title, Paragraph } = Typography;

export default function ReferralsPage() {
  const { user } = useAuth();
  const { data: referrals, isLoading } = useMyReferrals();
  const [copied, setCopied] = useState(false);

  // Build referral link — uses email or a placeholder
  const referralCode = `ISP-${(user?.firstName || 'REF').substring(0, 3).toUpperCase()}-${(user?.userId || '').substring(0, 4).toUpperCase()}`;
  const referralLink = `https://ispeakacademy.org/enroll?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    message.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <PageHeader
        title="Refer a Friend"
        subtitle="Share iSpeak Academy and earn rewards"
      />

      {/* Referral Link Card */}
      <Card className="mb-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-3">
            <GiftOutlined className="text-3xl text-green-600" />
          </div>
          <Title level={4} className="!mb-1">Share Your Referral Link</Title>
          <Paragraph type="secondary" className="max-w-md mx-auto">
            Know someone who would benefit from iSpeak Academy? Share your unique referral link
            and help them start their communication journey.
          </Paragraph>
        </div>

        <div className="max-w-lg mx-auto">
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              size="large"
              prefix={<ShareAltOutlined className="text-gray-400" />}
            />
            <Button
              type="primary"
              size="large"
              icon={<CopyOutlined />}
              onClick={handleCopy}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </div>
          <Text type="secondary" className="text-xs mt-2 block text-center">
            Your referral code: <Text strong code>{referralCode}</Text>
          </Text>
        </div>
      </Card>

      {/* How It Works */}
      <Card title="How It Works" size="small" className="mb-6">
        <Steps
          direction="horizontal"
          size="small"
          className="max-w-xl mx-auto"
          items={[
            {
              title: 'Share',
              description: 'Share your referral link with friends',
              icon: <ShareAltOutlined />,
            },
            {
              title: 'Sign Up',
              description: 'They sign up using your link',
              icon: <UserAddOutlined />,
            },
            {
              title: 'Enroll',
              description: 'They enroll in a program',
              icon: <TeamOutlined />,
            },
            {
              title: 'Reward',
              description: 'You both benefit!',
              icon: <GiftOutlined />,
            },
          ]}
        />
      </Card>

      {/* Referrals List */}
      <Card title="Your Referrals" size="small">
        {isLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : referrals && referrals.length > 0 ? (
          <Table
            dataSource={referrals}
            rowKey="clientId"
            size="small"
            scroll={{ x: true }}
            pagination={false}
            columns={[
              {
                title: 'Name',
                key: 'name',
                render: (_, record: any) => (
                  <Text>{record.firstName} {record.lastName}</Text>
                ),
              },
              {
                title: 'Status',
                key: 'status',
                render: (_, record: any) => {
                  const status = record.status || 'lead';
                  const colorMap: Record<string, string> = {
                    lead: 'default',
                    prospect: 'processing',
                    enrolled: 'blue',
                    completed: 'success',
                  };
                  return <Tag color={colorMap[status] || 'default'}>{status}</Tag>;
                },
              },
              {
                title: 'Date',
                key: 'date',
                responsive: ['md'],
                render: (_, record: any) =>
                  record.createdAt ? new Date(record.createdAt).toLocaleDateString() : '-',
              },
            ]}
          />
        ) : (
          <EmptyState
            icon={<TeamOutlined />}
            title="No referrals yet"
            description="Share your link to start referring friends to iSpeak Academy"
          />
        )}
      </Card>
    </>
  );
}
