import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import crypto from 'crypto';
import logger from '../config/logger';
import { AuditLogger } from '../utils/audit-logger';

/**
 * API Key Service
 * Handles all API key management operations
 */
export class ApiKeyService {
  /**
   * Create a new API key
   */
  async create(data: {
    name: string;
    environment?: string;
    scopes?: string[];
  }, request?: any) {
    const orgId = request?.user?.orgId || 'org_acme';
    
    if (!data.name) {
      throw ApiError.badRequest('Name is required');
    }

    try {
      // Generate a secure random key
      const rawKey = crypto.randomBytes(32).toString('hex');
      const keyPrefix = 'sk_' + (data.environment || 'live');
      const fullKey = `${keyPrefix}_${rawKey}`;
      
      // Hash the key for storage
      const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
      const last4 = rawKey.slice(-4);

      const apiKey = await prisma.api_keys.create({
        data: {
          org_id: orgId,
          name: data.name,
          key_prefix: keyPrefix,
          key_hash: keyHash,
          last4,
          environment: data.environment || 'production',
          scopes: data.scopes || [],
          status: 'active',
        },
      });

      // Log successful creation
      await AuditLogger.logSuccess(
        orgId,
        request?.user?.email || 'system',
        'api_key.created',
        data.name,
        apiKey.id,
        {
          environment: data.environment || 'production',
          key_prefix: keyPrefix,
        },
        request
      );

      logger.info('API key created', { id: apiKey.id, name: data.name });

      // Return the full key only once (never stored in plain text)
      return {
        ...apiKey,
        key: fullKey, // Only returned on creation
      };
    } catch (error: any) {
      // Log failed creation
      await AuditLogger.logFailure(
        orgId,
        request?.user?.email || 'unknown',
        'api_key.create',
        data.name,
        null,
        { error: error.message },
        request
      );

      logger.error('Error creating API key', { error });
      throw error;
    }
  }

  /**
   * Get all API keys for an org with pagination
   */
  async findAll(orgId: string, page = 1, limit = 10, filters?: any) {
    try {
      const skip = (page - 1) * limit;
      const where: any = { org_id: orgId };

      if (filters?.status) {
        where.status = filters.status;
      }
      if (filters?.environment) {
        where.environment = filters.environment;
      }
      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { key_prefix: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const [apiKeys, total] = await Promise.all([
        prisma.api_keys.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          select: {
            id: true,
            org_id: true,
            name: true,
            key_prefix: true,
            last4: true,
            environment: true,
            scopes: true,
            status: true,
            last_used_at: true,
            created_at: true,
            // Never return key_hash
          },
        }),
        prisma.api_keys.count({ where }),
      ]);

      logger.info('API keys fetched', { orgId, page, limit, total });

      return { apiKeys, total };
    } catch (error) {
      logger.error('Error fetching API keys', { error, orgId });
      throw error;
    }
  }

  /**
   * Get API key by ID
   */
  async findById(id: string) {
    try {
      const apiKey = await prisma.api_keys.findUnique({
        where: { id },
        select: {
          id: true,
          org_id: true,
          name: true,
          key_prefix: true,
          last4: true,
          environment: true,
          scopes: true,
          status: true,
          last_used_at: true,
          created_at: true,
        },
      });

      if (!apiKey) {
        throw ApiError.notFound('API key not found');
      }

      return apiKey;
    } catch (error) {
      logger.error('Error fetching API key', { error, id });
      throw error;
    }
  }

  /**
   * Update API key
   */
  async update(id: string, data: {
    name?: string;
    scopes?: string[];
    status?: string;
  }) {
    try {
      // Check if API key exists
      const existing = await prisma.api_keys.findUnique({
        where: { id },
      });

      if (!existing) {
        throw ApiError.notFound('API key not found');
      }

      const updated = await prisma.api_keys.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.scopes && { scopes: data.scopes }),
          ...(data.status && { status: data.status }),
        },
        select: {
          id: true,
          org_id: true,
          name: true,
          key_prefix: true,
          last4: true,
          environment: true,
          scopes: true,
          status: true,
          last_used_at: true,
          created_at: true,
        },
      });

      logger.info('API key updated', { id });

      return updated;
    } catch (error) {
      logger.error('Error updating API key', { error, id });
      throw error;
    }
  }

  /**
   * Revoke (deactivate) an API key
   */
  async revoke(id: string) {
    try {
      const existing = await prisma.api_keys.findUnique({
        where: { id },
      });

      if (!existing) {
        throw ApiError.notFound('API key not found');
      }

      const revoked = await prisma.api_keys.update({
        where: { id },
        data: { status: 'revoked' },
      });

      logger.info('API key revoked', { id });

      return revoked;
    } catch (error) {
      logger.error('Error revoking API key', { error, id });
      throw error;
    }
  }

  /**
   * Delete an API key
   */
  async delete(id: string) {
    try {
      const existing = await prisma.api_keys.findUnique({
        where: { id },
      });

      if (!existing) {
        throw ApiError.notFound('API key not found');
      }

      await prisma.api_keys.delete({
        where: { id },
      });

      logger.info('API key deleted', { id });

      return { success: true };
    } catch (error) {
      logger.error('Error deleting API key', { error, id });
      throw error;
    }
  }
}

// Export singleton instance
export default new ApiKeyService();
