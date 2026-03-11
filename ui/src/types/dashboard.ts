export interface DashboardOverview {
  totalClients: number;
  newClientsThisMonth: number;
  activeEnrollments: number;
  totalRevenue: number;
  revenueThisMonth: number;
  revenueGrowthPercent: number;
  outstandingBalance: number;
  overdueInvoices: number;
  activeCohorts: number;
}

export interface EnrollmentStats {
  byStatus: Record<string, number>;
  thisMonth: number;
  lastMonth: number;
  growthPercent: number;
}

export interface RevenueMonthData {
  month: string;
  amount: number;
}

export interface RevenueStats {
  totalCollected: number;
  totalInvoiced: number;
  collectionRate: number;
  byMonth: RevenueMonthData[];
}

export interface ActivityItem {
  id: string;
  type: 'enrollment' | 'payment' | 'communication' | 'client';
  description: string;
  timestamp: string;
  metadata?: Record<string, string>;
}

export interface ProgramPerformance {
  programId: string;
  programName: string;
  programCode: string;
  activeEnrollments: number;
  totalEnrollments: number;
  totalRevenue: number;
  completionRate: number;
}

export interface CohortSummary {
  cohortId: string;
  cohortName: string;
  programName: string;
  status: string;
  capacity: number;
  enrolled: number;
  fillRate: number;
  startDate: string;
  endDate: string;
}
