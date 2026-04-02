import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class RoleService {
  async create(data: any) {
    const existingRole = await prisma.roles.findUnique({
      where: { org_id_name: { org_id: data.org_id, name: data.name } },
    });

    if (existingRole) {
      throw ApiError.conflict('Role with this name already exists in the organization');
    }

    const role = await prisma.roles.create({
      data: {
        name: data.name,
        description: data.description,
        org_id: data.org_id,
        role_permissions: {
          create: data.permissions?.map((permission: string) => ({ permission })) || [],
        },
      },
      include: {
        role_permissions: true,
        _count: {
          select: { users: true },
        },
      },
    });

    return role;
  }

  async findAllByCreator(creatorId: string, page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      organizations: {
        created_by: creatorId
      }
    };

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const [roles, total] = await Promise.all([
      prisma.roles.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          role_permissions: {
            select: { permission: true },
          },
          _count: {
            select: { users: true },
          },
          organizations: {
            select: { name: true },
          },
        },
      }),
      prisma.roles.count({ where }),
    ]);

    return { roles, total, page, limit };
  }

  async findById(id: string, orgId: string) {
    const role = await prisma.roles.findFirst({
      where: { id, org_id: orgId },
      include: {
        role_permissions: {
          select: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw ApiError.notFound('Role not found');
    }

    return role;
  }

  async update(id: string, orgId: string, data: any) {
    const role = await this.findById(id, orgId);

    // Check if name is being updated and conflicts
    if (data.name && data.name !== role.name) {
      const existingRole = await prisma.roles.findUnique({
        where: { org_id_name: { org_id: orgId, name: data.name } },
      });
      if (existingRole) {
        throw ApiError.conflict('Role with this name already exists in the organization');
      }
    }

    // Update permissions if provided
    if (data.permissions !== undefined) {
      await prisma.role_permissions.deleteMany({ where: { role_id: id } });
      if (data.permissions.length > 0) {
        await prisma.role_permissions.createMany({
          data: data.permissions.map((permission: string) => ({ role_id: id, permission })),
        });
      }
    }

    const updatedRole = await prisma.roles.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
      },
      include: {
        role_permissions: {
          select: { permission: true },
        },
        _count: {
          select: { users: true },
        },
      },
    });

    return updatedRole;
  }

  async delete(id: string, orgId: string) {
    const role = await this.findById(id, orgId);

    // Check if role has users
    if (role._count.users > 0) {
      throw ApiError.badRequest('Cannot delete role that has assigned users');
    }

    await prisma.roles.delete({ where: { id } });
  }

  async getPermissions(_orgId: string) {
    // For now, return a static list of permissions
    // In a real app, this might be dynamic
    return [
      'users.read',
      'users.write',
      'roles.read',
      'roles.write',
      'billing.read',
      'billing.write',
      'invoices.read',
      'invoices.write',
      'pricing.read',
      'pricing.write',
      'meters.read',
      'meters.write',
      'api.read',
      'api.write',
      'dashboard.read',
      'reports.read',
    ];
  }
}

export default new RoleService();