import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import bcrypt from 'bcryptjs';

export class UserService {
  async create(data: any) {
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists');
    }

    // Hash password if provided
    // let hashedPassword;
    // if (data.password) {
    //   hashedPassword = await bcrypt.hash(data.password, 10);
    // }

    // Generate avatar initials
    const avatar_initials = data.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    try {
      return await prisma.users.create({
        data: {
          name: data.name,
          email: data.email,
          org_id: data.org_id,
          role_id: data.role_id,
          status: data.status || 'active',
          avatar_initials,
        },
        include: {
          roles: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        // Foreign key constraint violation
        throw ApiError.badRequest('Invalid organization or role ID');
      }
      throw error;
    }
  }

  async findAll(orgId: string, page = 1, limit = 10, search?: string, filters?: any) {
    const skip = (page - 1) * limit;

    const where: any = { org_id: orgId };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.role_id) {
      where.role_id = filters.role_id;
    }

    const [users, total] = await Promise.all([
      prisma.users.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          roles: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      }),
      prisma.users.count({ where }),
    ]);

    return { users, total, page, limit };
  }

  async findById(id: string) {
    const user = await prisma.users.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role_permissions: true,
          },
        },
        organizations: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role_permissions: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found');
    }

    return user;
  }

  async update(id: string, data: any) {
    await this.findById(id);

    if (data.email) {
      const existingUser = await prisma.users.findUnique({
        where: { email: data.email },
      });
      if (existingUser && existingUser.id !== id) {
        throw ApiError.conflict('Email already in use');
      }
    }

    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return await prisma.users.update({
      where: { id },
      data: updateData,
      include: {
        roles: {
          select: {
            name: true,
            description: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return await prisma.users.delete({ where: { id } });
  }

  async updateLastActive(id: string) {
    return await prisma.users.update({
      where: { id },
      data: { last_active_at: new Date() },
    });
  }
}

export default new UserService();
