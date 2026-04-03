import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class AlertsService {
  async create(orgId: string, data: any) {
    // Verify organization exists
    const organization = await prisma.organizations.findUnique({
      where: { id: orgId },
    });

    if (!organization) {
      throw ApiError.notFound('Organization not found');
    }

    return await prisma.alerts.create({
      data: {
        org_id: orgId,
        ...data,
      },
      include: {
        alert_channel_map: {
          include: {
            alert_channels: true,
          },
        },
      },
    });
  }

  async findByOrgId(orgId: string, filters: any = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where: any = { org_id: orgId };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.alert_type) {
      where.alert_type = filters.alert_type;
    }

    // Use transaction to reduce connection usage
    const result = await prisma.$transaction(async (tx) => {
      const [alerts, totalResult] = await Promise.all([
        tx.alerts.findMany({
          where,
          skip,
          take: limit,
          orderBy: { created_at: 'desc' },
          include: {
            alert_channel_map: {
              include: {
                alert_channels: true,
              },
            },
            _count: {
              select: {
                alert_history: true,
              },
            },
          },
        }),
        tx.alerts.count({ where }),
      ]);

      return { alerts, total: totalResult };
    });

    return {
      alerts: result.alerts,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: Math.ceil(result.total / limit),
      },
    };
  }

  async findById(id: string) {
    const alert = await prisma.alerts.findUnique({
      where: { id },
      include: {
        alert_channel_map: {
          include: {
            alert_channels: true,
          },
        },
        alert_history: {
          orderBy: { triggered_at: 'desc' },
          take: 10,
        },
      },
    });

    if (!alert) {
      throw ApiError.notFound('Alert not found');
    }

    return alert;
  }

  async update(id: string, data: any) {
    const alert = await prisma.alerts.findUnique({
      where: { id },
    });

    if (!alert) {
      throw ApiError.notFound('Alert not found');
    }

    return await prisma.alerts.update({
      where: { id },
      data,
      include: {
        alert_channel_map: {
          include: {
            alert_channels: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const alert = await prisma.alerts.findUnique({
      where: { id },
    });

    if (!alert) {
      throw ApiError.notFound('Alert not found');
    }

    await prisma.alerts.delete({
      where: { id },
    });

    return { message: 'Alert deleted successfully' };
  }

  async getAlertHistory(alertId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.alert_history.findMany({
        where: { alert_id: alertId },
        skip,
        take: limit,
        orderBy: { triggered_at: 'desc' },
        include: {
          alert_channels: true,
          customers: true,
        },
      }),
      prisma.alert_history.count({ where: { alert_id: alertId } }),
    ]);

    return {
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getOrganizationAlertHistory(orgId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.alert_history.findMany({
        where: {
          alerts: {
            org_id: orgId,
          },
        },
        skip,
        take: limit,
        orderBy: { triggered_at: 'desc' },
        include: {
          alert_channels: true,
          customers: true,
          alerts: {
            select: {
              id: true,
              name: true,
              alert_type: true,
            },
          },
        },
      }),
      prisma.alert_history.count({
        where: {
          alerts: {
            org_id: orgId,
          },
        },
      }),
    ]);

    return {
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}
