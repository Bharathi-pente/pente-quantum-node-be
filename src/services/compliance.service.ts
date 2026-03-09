/**
 * Compliance Service
 *
 * Business logic for compliance reports and audit management.
 */

import { complianceRepository } from '../repositories';
import { AuditLogger } from '../utils/audit-logger';
import { v4 as uuidv4 } from 'uuid';

export interface CreateComplianceReportData {
  framework: string;
  periodStart: Date;
  periodEnd: Date;
  findings?: any;
}

export interface UpdateComplianceReportData {
  status?: string;
  findings?: any;
  downloadUrl?: string;
}

export class ComplianceService {
  /**
   * Get compliance reports with pagination
   */
  async getReports(orgId: string, options: {
    cursor?: string;
    limit?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    framework?: string;
    status?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const result = await complianceRepository.findWithCursor(orgId, {
      cursor: options.cursor,
      limit: options.limit,
      sortField: options.sortField,
      sortOrder: options.sortOrder,
      filters: {
        framework: options.framework,
        status: options.status,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
      },
    });

    return result;
  }

  /**
   * Get compliance statistics
   */
  async getStats(orgId: string) {
    return await complianceRepository.getStats(orgId);
  }

  /**
   * Create a new compliance report
   */
  async createReport(orgId: string, data: CreateComplianceReportData, userId: string) {
    const report = await complianceRepository.create({
      id: uuidv4(),
      org_id: orgId,
      framework: data.framework,
      status: 'generating',
      last_audit_date: null,
      next_audit_date: null,
      findings_count: 0,
    });

    // Log the creation
    await AuditLogger.log({
      org_id: orgId,
      actor: userId,
      action: 'compliance_report_created',
      status: 'success',
      resource_label: `Compliance Report - ${data.framework}`,
      resource_id: report.id,
      details: {
        framework: data.framework,
        period_start: data.periodStart,
        period_end: data.periodEnd,
      },
    });

    return report;
  }

  /**
   * Update compliance report
   */
  async updateReport(id: string, data: UpdateComplianceReportData, userId: string) {
    const existingReport = await complianceRepository.findById(id);
    if (!existingReport) {
      throw new Error('Compliance report not found');
    }

    const updatedReport = await complianceRepository.updateStatus(
      id,
      data.status || existingReport.status,
      {} // details
    );

    // Log the update
    await AuditLogger.log({
      org_id: existingReport.org_id,
      actor: userId,
      action: 'compliance_report_updated',
      status: 'success',
      resource_label: `Compliance Report - ${existingReport.framework}`,
      resource_id: id,
      details: {
        status: data.status,
      },
    });

    return updatedReport;
  }

  /**
   * Get reports by framework
   */
  async getReportsByFramework(orgId: string, framework: string) {
    return await complianceRepository.findByFramework(orgId, framework);
  }

  /**
   * Generate compliance report (placeholder for actual report generation logic)
   */
  async generateReport(orgId: string, framework: string, periodStart: Date, periodEnd: Date, userId: string) {
    // This would contain the actual report generation logic
    // For now, we'll create a basic report structure

    const findings = await this.calculateFindings(orgId, framework, periodStart, periodEnd);

    const report = await this.createReport(orgId, {
      framework,
      periodStart,
      periodEnd,
      findings,
    }, userId);

    // Mark as completed after "generation"
    await this.updateReport(report.id, {
      status: 'completed',
      findings,
    }, userId);

    return report;
  }

  /**
   * Calculate findings for a compliance report
   */
  private async calculateFindings(orgId: string, framework: string, periodStart: Date, periodEnd: Date) {
    // This would contain the actual compliance checking logic
    // For demonstration, we'll return mock findings based on framework

    switch (framework.toLowerCase()) {
      case 'gdpr':
        const gdprStats = await this.getGDPRStats(orgId);
        return {
          total_requests: gdprStats.totalRequests,
          completed_requests: gdprStats.completedRequests,
          pending_requests: gdprStats.pendingRequests,
          avg_response_time: gdprStats.avgResponseTime,
          compliance_rate: gdprStats.complianceRate,
          period_start: periodStart,
          period_end: periodEnd,
        };

      case 'data_retention':
        const retentionStats = await this.getDataRetentionStats(orgId);
        return {
          policies_reviewed: retentionStats.totalPolicies,
          policies_compliant: retentionStats.activePolicies,
          policies_due_review: retentionStats.policiesDueForReview,
          categories_count: retentionStats.categoriesCount,
          period_start: periodStart,
          period_end: periodEnd,
        };

      default:
        return {
          message: `Compliance check completed for ${framework}`,
          period_start: periodStart,
          period_end: periodEnd,
        };
    }
  }

  /**
   * Get GDPR statistics for compliance reporting
   */
  private async getGDPRStats(_orgId: string) {
    // Import here to avoid circular dependencies
    const { gdprRepository } = await import('../repositories');
    return await gdprRepository.getStats();
  }

  /**
   * Get data retention statistics for compliance reporting
   */
  private async getDataRetentionStats(orgId: string) {
    // Import here to avoid circular dependencies
    const { dataRetentionRepository } = await import('../repositories');
    return await dataRetentionRepository.getStats(orgId);
  }
}

export const complianceService = new ComplianceService();