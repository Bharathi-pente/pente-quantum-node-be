/**
 * GDPR Service
 *
 * Business logic for GDPR request processing and data privacy compliance.
 */

import { gdprRepository, customerRepository } from '../repositories';
import { AuditLogger } from '../utils/audit-logger';

export interface CreateGDPRRequestData {
  requestType: 'data_portability' | 'data_deletion' | 'data_rectification' | 'data_restriction' | 'data_objection';
  dataCategories: string[];
  notes?: string;
}

export interface UpdateGDPRRequestData {
  status?: 'pending_approval' | 'in_progress' | 'completed' | 'rejected';
  notes?: string;
  downloadUrl?: string;
}

export class GDPRService {
  /**
   * Get GDPR requests with pagination
   */
  async getRequests(options: {
    cursor?: string;
    limit?: number;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    requestType?: string;
    status?: string;
    customerEmail?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }) {
    const result = await gdprRepository.findWithCursor({
      cursor: options.cursor,
      limit: options.limit,
      sortField: options.sortField,
      sortOrder: options.sortOrder,
      filters: {
        requestType: options.requestType,
        status: options.status,
        customerEmail: options.customerEmail,
        dateFrom: options.dateFrom,
        dateTo: options.dateTo,
      },
    });

    return result;
  }

  /**
   * Get GDPR statistics
   */
  async getStats(): Promise<Record<string, any>> {
    return await gdprRepository.getStats();
  }

  /**
   * Create a new GDPR request
   */
  async createRequest(customerId: string, data: CreateGDPRRequestData, userId: string, orgId: string) {
    // Get customer details for the request
    const customer = await customerRepository.findById(customerId);
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Map frontend request types to database values
    const requestTypeMapping: Record<string, string> = {
      'data_portability': 'data_export',
      'data_deletion': 'data_deletion',
      'data_rectification': 'data_rectification',
      'data_restriction': 'data_deletion', // Map to deletion for now
      'data_objection': 'data_deletion', // Map to deletion for now
    };

    const dbRequestType = requestTypeMapping[data.requestType] || 'data_export';

    const request = await gdprRepository.create({
      customer_id: customerId,
      customer_email: customer.email,
      request_type: dbRequestType,
      status: 'pending_approval',
      requested_at: new Date(),
      data_size: null, // Will be set when processing
      completed_at: null,
    });

    // Log the creation
    await AuditLogger.log({
      org_id: orgId,
      actor: userId,
      action: 'gdpr_request_created',
      status: 'success',
      resource_label: `GDPR Request - ${data.requestType}`,
      resource_id: request.id,
      details: {
        customer_id: customerId,
        customer_email: customer.email,
        request_type: data.requestType,
      },
    });

    return request;
  }

  /**
   * Update GDPR request
   */
  async updateRequest(id: string, data: UpdateGDPRRequestData, userId: string) {
    const existingRequest = await gdprRepository.findById(id);
    if (!existingRequest) {
      throw new Error('GDPR request not found');
    }

    const completedDate = data.status === 'completed' ? new Date() : undefined;

    const updatedRequest = await gdprRepository.updateStatus(
      id,
      data.status || existingRequest.status,
      completedDate
    );

    // Log the update
    await AuditLogger.log({
      org_id: 'system', // Since we don't have org_id in the schema
      actor: userId,
      action: 'gdpr_request_updated',
      status: 'success',
      resource_label: `GDPR Request - ${existingRequest.request_type}`,
      resource_id: id,
      details: {
        status: data.status,
        completed_date: completedDate,
      },
    });

    return updatedRequest;
  }

  /**
   * Process GDPR request (execute the actual data operation)
   */
  async processRequest(id: string, userId: string) {
    const request = await gdprRepository.findById(id);
    if (!request) {
      throw new Error('GDPR request not found');
    }

    if (request.status !== 'pending') {
      throw new Error('Request is not in pending status');
    }

    // Update status to in_progress
    await this.updateRequest(id, { status: 'in_progress' }, userId);

    try {
      // Execute the GDPR operation based on request type
      const result = await this.executeGDPROperation(request);

      // Update request as completed
      await this.updateRequest(id, {
        status: 'completed',
      }, userId);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      // Update request as failed
      await this.updateRequest(id, {
        status: 'rejected',
        notes: `Processing failed: ${errorMessage}`,
      }, userId);

      throw error;
    }
  }

  /**
   * Get requests by customer
   */
  async getRequestsByCustomer(customerId: string) {
    return await gdprRepository.findByCustomer(customerId);
  }

  /**
   * Get requests by type
   */
  async getRequestsByType(requestType: string) {
    return await gdprRepository.findByType(requestType);
  }

  /**
   * Get overdue requests
   */
  async getOverdueRequests() {
    return await gdprRepository.findOverdue();
  }

  /**
   * Execute GDPR operation based on request type
   */
  private async executeGDPROperation(request: any) {
    switch (request.request_type) {
      case 'data_portability':
        return await this.executeDataPortability(request);
      case 'data_deletion':
        return await this.executeDataDeletion(request);
      case 'data_rectification':
        return await this.executeDataRectification(request);
      case 'data_restriction':
        return await this.executeDataRestriction(request);
      case 'data_objection':
        return await this.executeDataObjection(request);
      default:
        throw new Error(`Unsupported GDPR request type: ${request.request_type}`);
    }
  }

  /**
   * Execute data portability request
   */
  private async executeDataPortability(request: any) {
    // Collect all customer data
    const customerData = await this.collectCustomerData(request.customer_id, request.data_categories);

    // Generate downloadable file (would create actual file in production)
    const downloadUrl = `https://example.com/gdpr-exports/${request.id}.zip`;

    return {
      operation: 'data_portability',
      customer_id: request.customer_id,
      data_categories: request.data_categories,
      download_url: downloadUrl,
      data_collected: customerData,
    };
  }

  /**
   * Execute data deletion request
   */
  private async executeDataDeletion(request: any) {
    // Delete customer data (with proper checks and backups)
    const deletionResult = await this.deleteCustomerData(request.customer_id, request.data_categories);

    return {
      operation: 'data_deletion',
      customer_id: request.customer_id,
      data_categories: request.data_categories,
      records_deleted: deletionResult.recordsDeleted,
      backup_created: deletionResult.backupCreated,
    };
  }

  /**
   * Execute data rectification request
   */
  private async executeDataRectification(request: any) {
    // This would typically require manual intervention
    // For now, we'll mark it as requiring manual review

    return {
      operation: 'data_rectification',
      customer_id: request.customer_id,
      data_categories: request.data_categories,
      status: 'manual_review_required',
      message: 'Data rectification requests require manual review and processing.',
    };
  }

  /**
   * Execute data restriction request
   */
  private async executeDataRestriction(request: any) {
    // Restrict processing of customer data
    const restrictionResult = await this.restrictCustomerData(request.customer_id, request.data_categories);

    return {
      operation: 'data_restriction',
      customer_id: request.customer_id,
      data_categories: request.data_categories,
      processing_restricted: restrictionResult.processingRestricted,
    };
  }

  /**
   * Execute data objection request
   */
  private async executeDataObjection(request: any) {
    // Stop processing for specified purposes
    const objectionResult = await this.processDataObjection(request.customer_id, request.data_categories);

    return {
      operation: 'data_objection',
      customer_id: request.customer_id,
      data_categories: request.data_categories,
      processing_stopped: objectionResult.processingStopped,
    };
  }

  // Placeholder methods for GDPR operations - these would implement actual data operations
  private async collectCustomerData(_customerId: string, _dataCategories: string[]) {
    // Would collect and return customer data based on categories
    return {
      personal_info: {},
      billing_history: [],
      usage_data: [],
      audit_logs: [],
    };
  }

  private async deleteCustomerData(_customerId: string, _dataCategories: string[]) {
    // Would delete customer data (with proper GDPR compliance)
    return {
      recordsDeleted: 0,
      backupCreated: true,
    };
  }

  private async restrictCustomerData(_customerId: string, _dataCategories: string[]) {
    // Would restrict processing of customer data
    return {
      processingRestricted: true,
    };
  }

  private async processDataObjection(_customerId: string, _dataCategories: string[]) {
    // Would stop processing for specified purposes
    return {
      processingStopped: true,
    };
  }
}

export const gdprService = new GDPRService();