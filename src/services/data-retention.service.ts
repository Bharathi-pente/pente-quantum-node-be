/**
 * Data Retention Service
 *
 * Business logic for data retention policies and automated data cleanup.
 */

import { dataRetentionRepository } from '../repositories';
import { AuditLogger } from '../utils/audit-logger';
import { v4 as uuidv4 } from 'uuid';

export interface CreateDataRetentionPolicyData {
  name: string;
  description: string;
  retentionPeriod: number;
  retentionUnit: 'days' | 'months' | 'years';
  category: string;
  autoDelete: boolean;
  reviewFrequencyMonths?: number;
}

export interface UpdateDataRetentionPolicyData {
  name?: string;
  description?: string;
  retentionPeriod?: number;
  retentionUnit?: 'days' | 'months' | 'years';
  autoDelete?: boolean;
  status?: string;
}

export class DataRetentionService {
  /**
   * Get data retention policies with pagination
   */
  async getPolicies(orgId: string, options: {
    cursor?: string;
    limit?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    category?: string;
    status?: string;
    autoDelete?: boolean;
  }) {
    const result = await dataRetentionRepository.findWithCursor(orgId, {
      cursor: options.cursor,
      limit: options.limit,
      sortField: options.sortField,
      sortOrder: options.sortOrder,
      filters: {
        dataType: options.category,
        autoDelete: options.autoDelete,
      },
    });

    return result;
  }

  /**
   * Get data retention statistics
   */
  async getStats(orgId: string) {
    return await dataRetentionRepository.getStats(orgId);
  }

  /**
   * Create a new data retention policy
   */
  async createPolicy(orgId: string, data: CreateDataRetentionPolicyData, userId: string) {
    const policy = await dataRetentionRepository.create({
      id: uuidv4(),
      org_id: orgId,
      data_type: data.category,
      retention_period: `${data.retentionPeriod} ${data.retentionUnit}`,
      auto_delete: data.autoDelete,
      last_purge_at: null,
    });

    // Log the creation
    await AuditLogger.log({
      org_id: orgId,
      actor: userId,
      action: 'data_retention_policy_created',
      status: 'success',
      resource_label: `Data Retention Policy - ${data.name}`,
      resource_id: policy.id,
      details: {
        category: data.category,
        retention_period: data.retentionPeriod,
        retention_unit: data.retentionUnit,
        auto_delete: data.autoDelete,
      },
    });

    return policy;
  }

  /**
   * Update data retention policy
   */
  async updatePolicy(id: string, data: UpdateDataRetentionPolicyData, userId: string) {
    const existingPolicy = await dataRetentionRepository.findById(id);
    if (!existingPolicy) {
      throw new Error('Data retention policy not found');
    }

    const updateData: any = {
      updated_at: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.retentionPeriod !== undefined) updateData.retention_period = data.retentionPeriod;
    if (data.retentionUnit !== undefined) updateData.retention_unit = data.retentionUnit;
    if (data.autoDelete !== undefined) updateData.auto_delete = data.autoDelete;
    if (data.status !== undefined) updateData.status = data.status;

    const updatedPolicy = await dataRetentionRepository.update(id, updateData);

    // Log the update
    await AuditLogger.log({
      org_id: existingPolicy.org_id,
      actor: userId,
      action: 'data_retention_policy_updated',
      status: 'success',
      resource_label: `Data Retention Policy - ${existingPolicy.data_type}`,
      resource_id: id,
      details: data,
    });

    return updatedPolicy;
  }

  /**
   * Review policy (update last purge date)
   */
  async reviewPolicy(id: string, userId: string) {
    const updatedPolicy = await dataRetentionRepository.updateLastPurgeDate(
      id,
      new Date()
    );

    // Log the review
    await AuditLogger.log({
      org_id: updatedPolicy.org_id,
      actor: userId,
      action: 'data_retention_policy_reviewed',
      status: 'success',
      resource_label: `Data Retention Policy - ${updatedPolicy.data_type}`,
      resource_id: id,
      details: {
        last_purge_at: updatedPolicy.last_purge_at,
      },
    });

    return updatedPolicy;
  }

  /**
   * Get policies by data type
   */
  async getPoliciesByCategory(orgId: string, category: string) {
    return await dataRetentionRepository.findByDataType(orgId, category);
  }

  /**
   * Execute data cleanup based on policies
   */
  async executeDataCleanup(orgId: string, userId: string, dryRun: boolean = true) {
    const policies = await dataRetentionRepository.findMany({
      org_id: orgId,
      auto_delete: true,
    });

    const results = [];

    for (const policy of policies) {
      const cleanupResult = await this.executePolicyCleanup(policy, dryRun);
      results.push({
        policy_id: policy.id,
        data_type: policy.data_type,
        ...cleanupResult,
      });
    }

    // Log the cleanup execution
    await AuditLogger.log({
      org_id: orgId,
      actor: userId,
      action: 'data_cleanup_executed',
      status: 'success',
      resource_label: 'Data Retention Cleanup',
      details: {
        dry_run: dryRun,
        policies_processed: results.length,
        total_records_deleted: results.reduce((sum, r) => sum + (r.records_deleted || 0), 0),
      },
    });

    return {
      dry_run: dryRun,
      executed_at: new Date(),
      results,
    };
  }

  /**
   * Execute cleanup for a specific policy
   */
  private async executePolicyCleanup(policy: any, dryRun: boolean) {
    // Parse retention period from string like "7 years" or "30 days"
    const cutoffDate = this.parseCutoffDate(policy.retention_period);

    // This would contain the actual cleanup logic for each data category
    // For demonstration, we'll return mock results

    let recordsDeleted = 0;

    if (!dryRun) {
      // Execute actual cleanup based on data type
      switch (policy.data_type) {
        case 'audit_logs':
          recordsDeleted = await this.cleanupAuditLogs(policy.org_id, cutoffDate);
          break;
        case 'usage_data':
          recordsDeleted = await this.cleanupUsageData(policy.org_id, cutoffDate);
          break;
        case 'customer_data':
          recordsDeleted = await this.cleanupCustomerData(policy.org_id, cutoffDate);
          break;
        default:
          recordsDeleted = 0;
      }
    }

    return {
      cutoff_date: cutoffDate,
      records_deleted: recordsDeleted,
      dry_run: dryRun,
    };
  }

  /**
   * Parse cutoff date from retention period string like "7 years" or "30 days"
   */
  private parseCutoffDate(retentionPeriod: string): Date {
    const cutoffDate = new Date();
    const parts = retentionPeriod.toLowerCase().split(' ');
    const value = parseInt(parts[0]);
    const unit = parts[1];

    if (unit.includes('day')) {
      cutoffDate.setDate(cutoffDate.getDate() - value);
    } else if (unit.includes('month')) {
      cutoffDate.setMonth(cutoffDate.getMonth() - value);
    } else if (unit.includes('year')) {
      cutoffDate.setFullYear(cutoffDate.getFullYear() - value);
    }

    return cutoffDate;
  }

  // Placeholder cleanup methods - these would implement actual data deletion
  private async cleanupAuditLogs(_orgId: string, _cutoffDate: Date): Promise<number> {
    // Would delete old audit logs
    return 0; // Mock implementation
  }

  private async cleanupUsageData(_orgId: string, _cutoffDate: Date): Promise<number> {
    // Would delete old usage data
    return 0; // Mock implementation
  }

  private async cleanupCustomerData(_orgId: string, _cutoffDate: Date): Promise<number> {
    // Would delete old customer data (with proper GDPR compliance)
    return 0; // Mock implementation
  }
}

export const dataRetentionService = new DataRetentionService();