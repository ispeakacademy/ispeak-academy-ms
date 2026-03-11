'use client';

import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { Card, Skeleton, Typography } from 'antd';
import type { ReactNode } from 'react';

const { Text } = Typography;

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: number;
  trendLabel?: string;
  loading?: boolean;
  prefix?: string;
  valueClassName?: string;
}

export default function StatCard({
  label,
  value,
  icon,
  trend,
  trendLabel,
  loading,
  prefix,
  valueClassName,
}: StatCardProps) {
  if (loading) {
    return (
      <Card size="small">
        <Skeleton active paragraph={{ rows: 1 }} title={{ width: '60%' }} />
      </Card>
    );
  }

  return (
    <Card size="small" className="h-full">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <Text type="secondary" className="text-xs uppercase tracking-wider">
            {label}
          </Text>
          <div className={`text-2xl font-bold mt-1 ${valueClassName || 'text-gray-900'}`}>
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
          </div>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1">
              {trend >= 0 ? (
                <ArrowUpOutlined className="text-green-500 text-xs" />
              ) : (
                <ArrowDownOutlined className="text-red-500 text-xs" />
              )}
              <Text
                className="text-xs"
                type={trend >= 0 ? 'success' : 'danger'}
              >
                {Math.abs(trend).toFixed(1)}%
              </Text>
              {trendLabel && (
                <Text type="secondary" className="text-xs">
                  {trendLabel}
                </Text>
              )}
            </div>
          )}
        </div>
        {icon && (
          <div className="text-2xl text-blue-500 opacity-60 ml-2">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
