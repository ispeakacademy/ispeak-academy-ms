'use client';

import {
  ClientStatusColors,
  ClientStatusLabels,
  CohortStatusColors,
  CohortStatusLabels,
  CommStatusColors,
  CommStatusLabels,
  EmployeeStatusColors,
  EmployeeStatusLabels,
  EnrollmentStatusColors,
  EnrollmentStatusLabels,
  InvoiceStatusColors,
  InvoiceStatusLabels,
  PaymentStatusLabels,
  SessionStatusLabels,
} from '@/types/enums';
import { Tag } from 'antd';

type EntityType = 'client' | 'enrollment' | 'invoice' | 'cohort' | 'session' | 'payment' | 'communication' | 'employee';

const colorMaps: Record<string, Record<string, string>> = {
  client: ClientStatusColors,
  enrollment: EnrollmentStatusColors,
  invoice: InvoiceStatusColors,
  cohort: CohortStatusColors,
  employee: EmployeeStatusColors,
  communication: CommStatusColors,
};

const labelMaps: Record<string, Record<string, string>> = {
  client: ClientStatusLabels,
  enrollment: EnrollmentStatusLabels,
  invoice: InvoiceStatusLabels,
  cohort: CohortStatusLabels,
  session: SessionStatusLabels,
  payment: PaymentStatusLabels,
  communication: CommStatusLabels,
  employee: EmployeeStatusLabels,
};

interface StatusTagProps {
  type: EntityType;
  status: string;
}

export default function StatusTag({ type, status }: StatusTagProps) {
  const labels = labelMaps[type] || {};
  const colors = colorMaps[type] || {};
  const label = labels[status] || status;
  const color = colors[status] || 'default';

  return <Tag color={color}>{label}</Tag>;
}
