import prisma from '../config/database';
import { AuditLog, AuditLogFilter } from '../types';
import ApiError from '../utils/ApiError';

export class AuditService {
  async getAuditLogs(orgId: string, filters: AuditLogFilter) {
    const {
      page = 1,
      limit = 20,
      search,
      actor,
      action,
      resource_id,
      status,
      date_from,
      date_to,
      sort = 'created_at',
      order = 'desc'
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      org_id: orgId,
    };

    if (search) {
      where.OR = [
        { actor: { contains: search, mode: 'insensitive' } },
        { actor_name: { contains: search, mode: 'insensitive' } },
        { action: { contains: search, mode: 'insensitive' } },
        { resource_label: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (actor) {
      where.actor = actor;
    }

    if (action) {
      where.action = action;
    }

    if (resource_id) {
      where.resource_id = resource_id;
    }

    if (status) {
      where.status = status;
    }

    if (date_from || date_to) {
      where.created_at = {};
      if (date_from) {
        where.created_at.gte = new Date(date_from);
      }
      if (date_to) {
        where.created_at.lte = new Date(date_to);
      }
    }

    // Get total count
    const total = await prisma.audit_logs.count({ where });

    // Get audit logs
    const auditLogs = await prisma.audit_logs.findMany({
      where,
      skip,
      take: limit,
      orderBy: {
        [sort]: order,
      },
      include: {
        organizations: {
          select: {
            name: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(total / limit);

    return {
      data: auditLogs,
      meta: {
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    };
  }

  async getAuditLogById(orgId: string, id: string): Promise<AuditLog> {
    const auditLog = await prisma.audit_logs.findFirst({
      where: {
        id,
        org_id: orgId,
      },
      include: {
        organizations: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!auditLog) {
      throw ApiError.notFound('Audit log not found');
    }

    return auditLog;
  }

  async createAuditLog(data: {
    org_id: string;
    actor: string;
    actor_name?: string;
    action: string;
    resource_label?: string;
    resource_id?: string;
    ip_address?: string;
    user_agent?: string;
    status: string;
    details?: any;
  }): Promise<AuditLog> {
    try {
      return await prisma.audit_logs.create({
        data,
      });
    } catch (error: any) {
      throw ApiError.internal('Failed to create audit log');
    }
  }

  async getAuditStats(orgId: string, dateFrom?: string, dateTo?: string) {
    const where: any = {
      org_id: orgId,
    };

    if (dateFrom || dateTo) {
      where.created_at = {};
      if (dateFrom) {
        where.created_at.gte = new Date(dateFrom);
      }
      if (dateTo) {
        where.created_at.lte = new Date(dateTo);
      }
    }

    const [totalLogs, successCount, failureCount, topActions, recentActivity] = await Promise.all([
      prisma.audit_logs.count({ where }),

      prisma.audit_logs.count({
        where: {
          ...where,
          status: 'success',
        },
      }),

      prisma.audit_logs.count({
        where: {
          ...where,
          status: 'failed',
        },
      }),

      prisma.audit_logs.groupBy({
        by: ['action'],
        where,
        _count: {
          action: true,
        },
        orderBy: {
          _count: {
            action: 'desc',
          },
        },
        take: 10,
      }),

      prisma.audit_logs.findMany({
        where,
        orderBy: {
          created_at: 'desc',
        },
        take: 5,
        select: {
          id: true,
          action: true,
          actor_name: true,
          created_at: true,
          status: true,
        },
      }),
    ]);

    return {
      totalLogs,
      successCount,
      failureCount,
      successRate: totalLogs > 0 ? (successCount / totalLogs) * 100 : 0,
      topActions: topActions.map(item => ({
        action: item.action,
        count: item._count.action,
      })),
      recentActivity,
    };
  }

  async exportAuditLogs(orgId: string, filters: AuditLogFilter) {
    // For export, we can get more records (no pagination limit)
    const exportFilters = { ...filters, limit: 10000, page: 1 };
    const result = await this.getAuditLogs(orgId, exportFilters);

    return result.data;
  }
}