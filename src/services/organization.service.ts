import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class OrganizationService {
  async create(data: any) {
    const existingOrg = await prisma.organizations.findFirst({
      where: {
        OR: [
          { slug: data.slug },
          { billing_email: data.billing_email },
        ],
      },
    });

    if (existingOrg) {
      throw ApiError.conflict('Organization with this slug or email already exists');
    }

    return await prisma.organizations.create({
      data: {
        ...data,
        status: data.status || 'active',
      },
    });
  }

  async findAll(orgId?: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = orgId ? { id: orgId } : {};

    const [organizations, total] = await Promise.all([
      prisma.organizations.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          _count: {
            select: {
              customers: true,
            },
          },
        },
      }),
      prisma.organizations.count({ where }),
    ]);

    // Transform the data to include customer count
    const transformedOrganizations = organizations.map(org => ({
      ...org,
      customers: org._count.customers,
      _count: undefined, // Remove the _count field
    }));

    return { organizations: transformedOrganizations, total, page, limit };
  }

  async findById(id: string) {
    const organization = await prisma.organizations.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            status: true,
          },
        },
      },
    });

    if (!organization) {
      throw ApiError.notFound('Organization not found');
    }

    return organization;
  }

  async update(id: string, data: any) {
    const organization = await this.findById(id);

    if (data.slug && data.slug !== organization.slug) {
      const existingOrg = await prisma.organizations.findUnique({
        where: { slug: data.slug },
      });
      if (existingOrg) {
        throw ApiError.conflict('Slug already in use');
      }
    }

    return await prisma.organizations.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return await prisma.organizations.delete({ where: { id } });
  }
}

export default new OrganizationService();
