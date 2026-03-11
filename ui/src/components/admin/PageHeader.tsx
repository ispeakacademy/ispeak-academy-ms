'use client';

import { Breadcrumb, Typography } from 'antd';
import Link from 'next/link';
import type { ReactNode } from 'react';

const { Title, Text } = Typography;

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, breadcrumbs, actions }: PageHeaderProps) {
  const breadcrumbItems = breadcrumbs?.map((item) => ({
    title: item.href ? <Link href={item.href}>{item.label}</Link> : item.label,
  }));

  return (
    <div className="mb-6">
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumb items={breadcrumbItems} className="mb-2" />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Title level={4} className="!mb-0">
            {title}
          </Title>
          {subtitle && (
            <Text type="secondary" className="text-sm">
              {subtitle}
            </Text>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}
