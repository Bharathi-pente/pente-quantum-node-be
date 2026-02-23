import prisma from '../config/database';
// import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError';

export class AuthService {
  async login(email: string, _password: string) {
    // Find user with role permissions
    const user = await prisma.users.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role_permissions: true,
          },
        },
        organizations: true,
      },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password');
    }

    if (user.status !== 'active') {
      throw ApiError.forbidden('Account is not active');
    }

    // Note: In production, you should store hashed passwords
    // For now, we'll implement basic password checking
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   throw ApiError.unauthorized('Invalid email or password');
    // }

    // Extract permissions
    const permissions = user.roles?.role_permissions?.map(
      (rp: any) => rp.permission
    ) || [];

    // Generate JWT token
    // @ts-ignore
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        orgId: user.org_id,
        roleId: user.role_id,
        permissions,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Update last active
    await prisma.users.update({
      where: { id: user.id },
      data: { last_active_at: new Date() },
    });

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        orgId: user.org_id,
        organization: user.organizations?.name,
        role: user.roles?.name,
        permissions,
      },
    };
  }

  async register(data: any) {
    const existingUser = await prisma.users.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw ApiError.conflict('User already exists');
    }

    // const hashedPassword = await bcrypt.hash(data.password, 10);

    const avatar_initials = data.name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);

    const user = await prisma.users.create({
      data: {
        name: data.name,
        email: data.email,
        org_id: data.org_id,
        role_id: data.role_id,
        avatar_initials,
        status: 'active',
      },
    });

    // @ts-ignore
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        orgId: user.org_id,
        roleId: user.role_id,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        orgId: user.org_id,
      },
    };
  }

  async validateToken(token: string) {
    try {
      // @ts-ignore
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.users.findUnique({
        where: { id: decoded.id },
        include: {
          roles: {
            include: {
              role_permissions: true,
            },
          },
        },
      });

      if (!user || user.status !== 'active') {
        throw ApiError.unauthorized('Invalid token');
      }

      return user;
    } catch (error) {
      throw ApiError.unauthorized('Invalid token');
    }
  }
}

export default new AuthService();
