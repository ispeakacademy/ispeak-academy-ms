import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class DashboardService {
	private readonly logger = new Logger(DashboardService.name);

	constructor(private readonly dataSource: DataSource) {}

	/**
	 * Returns high-level KPI overview for the admin dashboard.
	 */
	async getOverviewKPIs() {
		this.logger.log('Fetching overview KPIs');

		const [
			totalClientsResult,
			newClientsThisMonthResult,
			activeEnrollmentsResult,
			totalRevenueResult,
			revenueThisMonthResult,
			outstandingBalanceResult,
			overdueInvoicesResult,
			activeCohortsResult,
		] = await Promise.all([
			// Total clients
			this.dataSource.query(
				`SELECT COUNT(*) AS count FROM clients WHERE deleted_at IS NULL`,
			),

			// New clients created this month
			this.dataSource.query(
				`SELECT COUNT(*) AS count FROM clients
				 WHERE deleted_at IS NULL
				   AND created_at >= date_trunc('month', CURRENT_DATE)`,
			),

			// Active enrollments (ACTIVE or CONFIRMED)
			this.dataSource.query(
				`SELECT COUNT(*) AS count FROM enrollments
				 WHERE status IN ('active', 'confirmed')`,
			),

			// Total revenue (sum of confirmed payments)
			this.dataSource.query(
				`SELECT COALESCE(SUM(amount), 0) AS total FROM payments
				 WHERE status = 'confirmed'`,
			),

			// Revenue this month (sum of confirmed payments in current month)
			this.dataSource.query(
				`SELECT COALESCE(SUM(amount), 0) AS total FROM payments
				 WHERE status = 'confirmed'
				   AND payment_date >= date_trunc('month', CURRENT_DATE)`,
			),

			// Outstanding balance (sum of invoice balance where status IN SENT, PARTIAL, OVERDUE)
			this.dataSource.query(
				`SELECT COALESCE(SUM(balance), 0) AS total FROM invoices
				 WHERE status IN ('sent', 'partial', 'overdue')`,
			),

			// Overdue invoices count
			this.dataSource.query(
				`SELECT COUNT(*) AS count FROM invoices
				 WHERE status = 'overdue'
				    OR (status IN ('sent', 'partial') AND due_date < NOW())`,
			),

			// Active cohorts (OPEN or IN_PROGRESS)
			this.dataSource.query(
				`SELECT COUNT(*) AS count FROM cohorts
				 WHERE status IN ('open', 'in_progress')`,
			),
		]);

		return {
			totalClients: parseInt(totalClientsResult[0]?.count ?? '0', 10),
			newClientsThisMonth: parseInt(newClientsThisMonthResult[0]?.count ?? '0', 10),
			activeEnrollments: parseInt(activeEnrollmentsResult[0]?.count ?? '0', 10),
			totalRevenue: parseFloat(totalRevenueResult[0]?.total ?? '0'),
			revenueThisMonth: parseFloat(revenueThisMonthResult[0]?.total ?? '0'),
			outstandingBalance: parseFloat(outstandingBalanceResult[0]?.total ?? '0'),
			overdueInvoices: parseInt(overdueInvoicesResult[0]?.count ?? '0', 10),
			activeCohorts: parseInt(activeCohortsResult[0]?.count ?? '0', 10),
		};
	}

	/**
	 * Returns enrollment statistics grouped by status, with monthly comparison.
	 */
	async getEnrollmentStats() {
		this.logger.log('Fetching enrollment stats');

		const [byStatusResult, thisMonthResult, lastMonthResult] = await Promise.all([
			// Enrollments grouped by status
			this.dataSource.query(
				`SELECT status, COUNT(*) AS count FROM enrollments
				 GROUP BY status
				 ORDER BY count DESC`,
			),

			// Enrollments created this month
			this.dataSource.query(
				`SELECT COUNT(*) AS count FROM enrollments
				 WHERE created_at >= date_trunc('month', CURRENT_DATE)`,
			),

			// Enrollments created last month
			this.dataSource.query(
				`SELECT COUNT(*) AS count FROM enrollments
				 WHERE created_at >= date_trunc('month', CURRENT_DATE) - INTERVAL '1 month'
				   AND created_at < date_trunc('month', CURRENT_DATE)`,
			),
		]);

		const byStatus = byStatusResult.map((row: { status: string; count: string }) => ({
			status: row.status,
			count: parseInt(row.count, 10),
		}));

		const thisMonth = parseInt(thisMonthResult[0]?.count ?? '0', 10);
		const lastMonth = parseInt(lastMonthResult[0]?.count ?? '0', 10);
		const growthPercent =
			lastMonth > 0
				? parseFloat((((thisMonth - lastMonth) / lastMonth) * 100).toFixed(2))
				: 0;

		return {
			byStatus,
			thisMonth,
			lastMonth,
			growthPercent,
		};
	}

	/**
	 * Returns revenue statistics: totals, collection rate, and last 6 months breakdown.
	 */
	async getRevenueStats() {
		this.logger.log('Fetching revenue stats');

		const [totalCollectedResult, totalInvoicedResult, byMonthResult] = await Promise.all([
			// Total collected (sum of confirmed payments)
			this.dataSource.query(
				`SELECT COALESCE(SUM(amount), 0) AS total FROM payments
				 WHERE status = 'confirmed'`,
			),

			// Total invoiced (sum of invoice total_amount, excluding voided)
			this.dataSource.query(
				`SELECT COALESCE(SUM(total_amount), 0) AS total FROM invoices
				 WHERE status != 'void'`,
			),

			// Last 6 months revenue by month
			this.dataSource.query(
				`SELECT
					TO_CHAR(payment_date, 'YYYY-MM') AS month,
					COALESCE(SUM(amount), 0) AS amount
				 FROM payments
				 WHERE status = 'confirmed'
				   AND payment_date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
				 GROUP BY TO_CHAR(payment_date, 'YYYY-MM')
				 ORDER BY month ASC`,
			),
		]);

		const totalCollected = parseFloat(totalCollectedResult[0]?.total ?? '0');
		const totalInvoiced = parseFloat(totalInvoicedResult[0]?.total ?? '0');
		const collectionRate =
			totalInvoiced > 0
				? parseFloat(((totalCollected / totalInvoiced) * 100).toFixed(2))
				: 0;

		const byMonth = byMonthResult.map((row: { month: string; amount: string }) => ({
			month: row.month,
			amount: parseFloat(row.amount),
		}));

		return {
			totalCollected,
			totalInvoiced,
			collectionRate,
			byMonth,
		};
	}

	/**
	 * Returns recent activity across enrollments, payments, and communications.
	 */
	async getRecentActivity(limit: number = 10) {
		this.logger.log(`Fetching recent activity (limit: ${limit})`);

		const safeLimit = Math.min(Math.max(limit, 1), 50);

		const result = await this.dataSource.query(
			`SELECT * FROM (
				SELECT
					enrollment_id AS id,
					'enrollment' AS type,
					'New enrollment created' AS description,
					created_at AS date
				FROM enrollments
				ORDER BY created_at DESC
				LIMIT $1
			) AS e

			UNION ALL

			SELECT * FROM (
				SELECT
					payment_id AS id,
					'payment' AS type,
					'Payment of ' || amount || ' ' || currency || ' received' AS description,
					payment_date AS date
				FROM payments
				WHERE status = 'confirmed'
				ORDER BY payment_date DESC
				LIMIT $1
			) AS p

			UNION ALL

			SELECT * FROM (
				SELECT
					communication_id AS id,
					'communication' AS type,
					'Message sent via ' || channel AS description,
					COALESCE(sent_at, created_at) AS date
				FROM communications
				WHERE status = 'sent'
				ORDER BY COALESCE(sent_at, created_at) DESC
				LIMIT $1
			) AS c

			ORDER BY date DESC
			LIMIT $1`,
			[safeLimit],
		);

		return result.map((row: { id: string; type: string; description: string; date: Date }) => ({
			id: row.id,
			type: row.type,
			description: row.description,
			date: row.date,
		}));
	}

	/**
	 * Returns program performance metrics: enrollments, revenue per program.
	 */
	async getProgramPerformance() {
		this.logger.log('Fetching program performance');

		const result = await this.dataSource.query(
			`SELECT
				p.program_id AS "programId",
				p.name AS "programName",
				COALESCE(active_enr.count, 0) AS "activeEnrollments",
				COALESCE(total_enr.count, 0) AS "totalEnrollments",
				COALESCE(rev.total, 0) AS "totalRevenue"
			 FROM programs p
			 LEFT JOIN (
				SELECT program_id, COUNT(*) AS count
				FROM enrollments
				WHERE status IN ('active', 'confirmed')
				GROUP BY program_id
			 ) active_enr ON active_enr.program_id = p.program_id
			 LEFT JOIN (
				SELECT program_id, COUNT(*) AS count
				FROM enrollments
				GROUP BY program_id
			 ) total_enr ON total_enr.program_id = p.program_id
			 LEFT JOIN (
				SELECT e.program_id, COALESCE(SUM(pay.amount), 0) AS total
				FROM enrollments e
				JOIN invoices i ON i.enrollment_id = e.enrollment_id
				JOIN payments pay ON pay.invoice_id = i.invoice_id AND pay.status = 'confirmed'
				GROUP BY e.program_id
			 ) rev ON rev.program_id = p.program_id
			 WHERE p.is_active = true
			 ORDER BY "totalRevenue" DESC`,
		);

		return result.map(
			(row: {
				programId: string;
				programName: string;
				activeEnrollments: string;
				totalEnrollments: string;
				totalRevenue: string;
			}) => ({
				programId: row.programId,
				programName: row.programName,
				activeEnrollments: parseInt(row.activeEnrollments as string, 10),
				totalEnrollments: parseInt(row.totalEnrollments as string, 10),
				totalRevenue: parseFloat(row.totalRevenue as string),
			}),
		);
	}

	/**
	 * Returns a summary of active cohorts with fill rate and program name.
	 */
	async getCohortSummary() {
		this.logger.log('Fetching cohort summary');

		const result = await this.dataSource.query(
			`SELECT
				c.cohort_id AS "cohortId",
				c.name AS "cohortName",
				p.name AS "programName",
				c.status,
				c.max_capacity AS capacity,
				c.current_enrollment AS enrolled,
				CASE
					WHEN c.max_capacity > 0
					THEN ROUND((c.current_enrollment::NUMERIC / c.max_capacity) * 100, 2)
					ELSE 0
				END AS "fillRate",
				c.start_date AS "startDate",
				c.end_date AS "endDate"
			 FROM cohorts c
			 JOIN programs p ON p.program_id = c.program_id
			 WHERE c.status IN ('open', 'in_progress', 'full')
			 ORDER BY c.start_date ASC`,
		);

		return result.map(
			(row: {
				cohortId: string;
				cohortName: string;
				programName: string;
				status: string;
				capacity: number;
				enrolled: number;
				fillRate: string;
				startDate: Date;
				endDate: Date;
			}) => ({
				cohortId: row.cohortId,
				cohortName: row.cohortName,
				programName: row.programName,
				status: row.status,
				capacity: row.capacity,
				enrolled: row.enrolled,
				fillRate: parseFloat(row.fillRate as string),
				startDate: row.startDate,
				endDate: row.endDate,
			}),
		);
	}
}
