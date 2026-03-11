'use client';

import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import { useDashboardOverview, useProgramPerformance, useRevenueStats } from '@/hooks/useDashboard';
import {
  DollarOutlined,
  FundOutlined,
  PercentageOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { Card, Progress, Skeleton, Table, Typography } from 'antd';

const { Text } = Typography;

export default function RevenuePage() {
  const { data: overview, isLoading: loadingOverview } = useDashboardOverview();
  const { data: revenueStats, isLoading: loadingRevenue } = useRevenueStats();
  const { data: programPerformance, isLoading: loadingPrograms } = useProgramPerformance();

  const formatCurrency = (amount: number) => `KES ${amount.toLocaleString()}`;

  return (
    <>
      <PageHeader
        title="Revenue"
        subtitle="Financial overview and revenue analytics"
        breadcrumbs={[{ label: 'Dashboard', href: '/admin' }, { label: 'Revenue' }]}
      />

      {/* Revenue KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Total Revenue"
          value={revenueStats?.totalCollected ?? 0}
          prefix="KES "
          icon={<DollarOutlined />}
          loading={loadingRevenue}
        />
        <StatCard
          label="Revenue This Month"
          value={overview?.revenueThisMonth ?? 0}
          prefix="KES "
          icon={<WalletOutlined />}
          trend={overview?.revenueGrowthPercent}
          trendLabel="vs last month"
          loading={loadingOverview}
        />
        <StatCard
          label="Outstanding Balance"
          value={overview?.outstandingBalance ?? 0}
          prefix="KES "
          icon={<FundOutlined />}
          loading={loadingOverview}
        />
        <StatCard
          label="Collection Rate"
          value={`${(revenueStats?.collectionRate ?? 0).toFixed(1)}%`}
          icon={<PercentageOutlined />}
          loading={loadingRevenue}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue Breakdown */}
        <Card title="Monthly Revenue Trend" size="small">
          {loadingRevenue ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : revenueStats?.byMonth && revenueStats.byMonth.length > 0 ? (
            <div className="space-y-3">
              {revenueStats.byMonth.map((month) => {
                const maxAmount = Math.max(...revenueStats.byMonth.map(m => m.amount));
                return (
                  <div key={month.month} className="flex items-center gap-3">
                    <Text type="secondary" className="text-xs w-20 flex-shrink-0">{month.month}</Text>
                    <div className="flex-1">
                      <Progress
                        percent={maxAmount > 0 ? Math.round((month.amount / maxAmount) * 100) : 0}
                        showInfo={false}
                        size="small"
                        strokeColor="#4096ff"
                      />
                    </div>
                    <Text className="text-xs w-28 text-right flex-shrink-0 font-medium">
                      {formatCurrency(month.amount)}
                    </Text>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Text type="secondary">No revenue data available</Text>
            </div>
          )}
        </Card>

        {/* Collection Rate Gauge */}
        <Card title="Revenue Summary" size="small">
          {loadingRevenue ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <div className="flex flex-col items-center py-4">
              <Progress
                type="dashboard"
                percent={Math.round(revenueStats?.collectionRate ?? 0)}
                size={180}
                strokeColor={{
                  '0%': '#ff4d4f',
                  '50%': '#faad14',
                  '100%': '#52c41a',
                }}
                format={(p) => (
                  <div className="text-center">
                    <div className="text-2xl font-bold">{p}%</div>
                    <div className="text-xs text-gray-500">Collection Rate</div>
                  </div>
                )}
              />
              <div className="grid grid-cols-2 gap-6 mt-6 w-full max-w-xs">
                <div className="text-center">
                  <Text type="secondary" className="text-xs">Total Invoiced</Text>
                  <div className="font-bold">{formatCurrency(revenueStats?.totalInvoiced ?? 0)}</div>
                </div>
                <div className="text-center">
                  <Text type="secondary" className="text-xs">Total Collected</Text>
                  <div className="font-bold text-green-600">{formatCurrency(revenueStats?.totalCollected ?? 0)}</div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Revenue by Program */}
      <Card title="Revenue by Program" size="small">
        <Table
          dataSource={programPerformance || []}
          loading={loadingPrograms}
          rowKey="programId"
          size="small"
          scroll={{ x: true }}
          pagination={false}
          columns={[
            {
              title: 'Program',
              key: 'program',
              render: (_, record) => (
                <div>
                  <Text strong>{record.programName}</Text>
                  <br />
                  <Text type="secondary" className="text-xs">{record.programCode}</Text>
                </div>
              ),
            },
            {
              title: 'Active Enrollments',
              dataIndex: 'activeEnrollments',
              key: 'active',
              align: 'center',
              width: 140,
            },
            {
              title: 'Total Enrollments',
              dataIndex: 'totalEnrollments',
              key: 'total',
              align: 'center',
              width: 140,
            },
            {
              title: 'Revenue',
              dataIndex: 'totalRevenue',
              key: 'revenue',
              width: 160,
              render: (value: number) => <Text strong>{formatCurrency(value)}</Text>,
            },
            {
              title: 'Completion Rate',
              dataIndex: 'completionRate',
              key: 'completion',
              width: 140,
              render: (rate: number) => (
                <Progress percent={Math.round(rate)} size="small" />
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
