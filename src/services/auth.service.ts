import prisma from '../config/database';
// import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import ApiError from '../utils/ApiError';
import { AuditLogger } from '../utils/audit-logger';

export class AuthService {
  async login(email: string, _password: string, request?: any) {
    try {
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
        // Log failed login attempt
        await AuditLogger.logFailure(
          'unknown', // We don't know the org_id yet
          email,
          'user.login',
          email,
          null,
          { reason: 'User not found' },
          request
        );
        throw ApiError.unauthorized('Invalid email or password');
      }

      if (user.status !== 'active') {
        // Log failed login attempt
        await AuditLogger.logFailure(
          user.org_id,
          email,
          'user.login',
          email,
          user.id,
          { reason: 'Account not active', status: user.status },
          request
        );
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

      // Log successful login
      await AuditLogger.logSuccess(
        user.org_id,
        email,
        'user.login',
        user.name || email,
        user.id,
        { method: 'password', role: user.roles?.name },
        request
      );

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
    } catch (error: any) {
      // If it's not already logged above, log the failure
      if (error.message !== 'Invalid email or password' && error.message !== 'Account is not active') {
        await AuditLogger.logFailure(
          'unknown',
          email,
          'user.login',
          email,
          null,
          { error: error.message },
          request
        );
      }
      throw error;
    }
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
