'use client';

import PageHeader from '@/components/admin/PageHeader';
import { UsergroupAddOutlined } from '@ant-design/icons';
import { Card, Typography } from 'antd';

const { Text, Title } = Typography;

export default function PartnersPage() {
  return (
    <>
      <PageHeader
        title="Partners"
        subtitle="Manage partner and affiliate relationships"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Partners' }]}
      />

      <Card className="text-center py-12">
        <div className="text-5xl text-gray-300 mb-4">
          <UsergroupAddOutlined />
        </div>
        <Title level={4} className="!text-gray-600">
          Partner Management
        </Title>
        <Text type="secondary" className="max-w-md mx-auto block">
          Partner and affiliate management is coming soon. This module will include partner profiles,
          referral tracking, commission management, partner portal access, and performance leaderboards.
        </Text>
      </Card>
    </>
  );
}
