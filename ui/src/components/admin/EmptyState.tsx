'use client';

import { InboxOutlined } from '@ant-design/icons';
import { Button, Typography } from 'antd';
import type { ReactNode } from 'react';

const { Text } = Typography;

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-5xl text-gray-300 mb-4">
        {icon || <InboxOutlined />}
      </div>
      <Text strong className="text-lg text-gray-600">
        {title}
      </Text>
      {description && (
        <Text type="secondary" className="mt-1 text-center max-w-md">
          {description}
        </Text>
      )}
      {actionLabel && onAction && (
        <Button type="primary" onClick={onAction} className="mt-4">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
