'use client';

import PageHeader from '@/components/admin/PageHeader';
import StatCard from '@/components/admin/StatCard';
import StatusTag from '@/components/admin/StatusTag';
import {
  useCohortSummary,
  useDashboardOverview,
  useProgramPerformance,
  useRecentActivity,
  useRevenueStats,
} from '@/hooks/useDashboard';
import {
  CalendarOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FileTextOutlined,
  FundOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { Card, Progress, Skeleton, Table, Tag, Timeline, Typography } from 'antd';

const { Text } = Typography;

export default function AdminDashboardPage() {
  const { data: overview, isLoading: loadingOverview } = useDashboardOverview();
  const { data: revenueStats, isLoading: loadingRevenue } = useRevenueStats();
  const { data: recentActivity, isLoading: loadingActivity } = useRecentActivity(10);
  const { data: programPerformance, isLoading: loadingPrograms } = useProgramPerformance();
  const { data: cohortSummary, isLoading: loadingCohorts } = useCohortSummary();

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const programColumns = [
    {
      title: 'Program',
      dataIndex: 'programName',
      key: 'programName',
      render: (name: string, record: any) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" className="text-xs">{record.programCode}</Text>
        </div>
      ),
    },
    {
      title: 'Active',
      dataIndex: 'activeEnrollments',
      key: 'activeEnrollments',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Total',
      dataIndex: 'totalEnrollments',
      key: 'totalEnrollments',
      width: 80,
      align: 'center' as const,
    },
    {
      title: 'Revenue',
      dataIndex: 'totalRevenue',
      key: 'totalRevenue',
      width: 140,
      render: (value: number) => formatCurrency(value),
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your business performance"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        <StatCard
          label="Total Clients"
          value={overview?.totalClients ?? 0}
          icon={<TeamOutlined />}
          trend={overview?.newClientsThisMonth ? undefined : undefined}
          trendLabel={overview?.newClientsThisMonth ? `${overview.newClientsThisMonth} new this month` : undefined}
          loading={loadingOverview}
        />
        <StatCard
          label="Active Enrollments"
          value={overview?.activeEnrollments ?? 0}
          icon={<FileTextOutlined />}
          loading={loadingOverview}
        />
        <StatCard
          label="Revenue This Month"
          value={overview?.revenueThisMonth ?? 0}
          icon={<DollarOutlined />}
          prefix="KES "
          trend={overview?.revenueGrowthPercent}
          trendLabel="vs last month"
          loading={loadingOverview}
        />
        <StatCard
          label="Outstanding"
          value={overview?.outstandingBalance ?? 0}
          icon={<FundOutlined />}
          prefix="KES "
          loading={loadingOverview}
        />
        <StatCard
          label="Overdue Invoices"
          value={overview?.overdueInvoices ?? 0}
          icon={<ClockCircleOutlined />}
          loading={loadingOverview}
          valueClassName={overview?.overdueInvoices ? 'text-red-600' : 'text-gray-900'}
        />
        <StatCard
          label="Active Cohorts"
          value={overview?.activeCohorts ?? 0}
          icon={<CalendarOutlined />}
          loading={loadingOverview}
        />
      </div>

      {/* Revenue + Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Revenue Summary */}
        <Card title="Monthly Revenue" size="small">
          {loadingRevenue ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : (
            <div>
              <div className="flex justify-between mb-4">
                <div>
                  <Text type="secondary" className="text-xs">Total Collected</Text>
                  <div className="text-lg font-bold">{formatCurrency(revenueStats?.totalCollected ?? 0)}</div>
                </div>
                <div>
                  <Text type="secondary" className="text-xs">Collection Rate</Text>
                  <div className="text-lg font-bold">{(revenueStats?.collectionRate ?? 0).toFixed(1)}%</div>
                </div>
              </div>
              <div className="space-y-2">
                {revenueStats?.byMonth?.slice(-6).map((month) => (
                  <div key={month.month} className="flex items-center gap-3">
                    <Text type="secondary" className="text-xs w-16 flex-shrink-0">{month.month}</Text>
                    <div className="flex-1">
                      <Progress
                        percent={revenueStats.totalCollected > 0
                          ? Math.round((month.amount / revenueStats.totalCollected) * 100 * 6)
                          : 0}
                        showInfo={false}
                        size="small"
                        strokeColor="#4096ff"
                      />
                    </div>
                    <Text className="text-xs w-24 text-right flex-shrink-0">
                      {formatCurrency(month.amount)}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Recent Activity */}
        <Card title="Recent Activity" size="small">
          {loadingActivity ? (
            <Skeleton active paragraph={{ rows: 6 }} />
          ) : recentActivity && recentActivity.length > 0 ? (
            <Timeline
              className="mt-2"
              items={recentActivity.map((item) => ({
                color: item.type === 'payment' ? 'green' : item.type === 'enrollment' ? 'blue' : 'gray',
                children: (
                  <div>
                    <Text className="text-sm">{item.description}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      {new Date(item.timestamp).toLocaleString()}
                    </Text>
                  </div>
                ),
              }))}
            />
          ) : (
            <div className="text-center py-8">
              <Text type="secondary">No recent activity</Text>
            </div>
          )}
        </Card>
      </div>

      {/* Program Performance + Active Cohorts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Program Performance */}
        <Card title="Program Performance" size="small">
          <Table
            dataSource={programPerformance || []}
            columns={programColumns}
            loading={loadingPrograms}
            pagination={false}
            size="small"
            rowKey="programId"
            scroll={{ x: true }}
          />
        </Card>

        {/* Active Cohorts */}
        <Card title="Active Cohorts" size="small">
          {loadingCohorts ? (
            <Skeleton active paragraph={{ rows: 4 }} />
          ) : cohortSummary && cohortSummary.length > 0 ? (
            <div className="space-y-3">
              {cohortSummary.map((cohort) => (
                <div key={cohort.cohortId} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <Text strong className="text-sm">{cohort.cohortName}</Text>
                      <br />
                      <Text type="secondary" className="text-xs">{cohort.programName}</Text>
                    </div>
                    <StatusTag type="cohort" status={cohort.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      percent={Math.round(cohort.fillRate)}
                      size="small"
                      className="flex-1"
                      format={() => `${cohort.enrolled}/${cohort.capacity}`}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <Text type="secondary" className="text-xs">
                      {new Date(cohort.startDate).toLocaleDateString()}
                    </Text>
                    <Text type="secondary" className="text-xs">
                      {new Date(cohort.endDate).toLocaleDateString()}
                    </Text>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Text type="secondary">No active cohorts</Text>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
