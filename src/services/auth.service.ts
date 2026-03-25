import prisma from '../config/database';
import jwt, { Secret } from 'jsonwebtoken';
import ApiError from '../utils/ApiError';
import { AuditLogger } from '../utils/audit-logger';

export class AuthService {
  async login(email: string, password: string, request?: any) {
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

      // Legacy password authentication is not supported when user records
      // do not contain a password field in the database. This backend uses
      // Keycloak for authentication. If a password field exists, compare it.
      if ((user as any).password) {
        // Dynamically import bcrypt only when needed
        const bcrypt = await import('bcryptjs');
        const isPasswordValid = await bcrypt.compare(password, (user as any).password);
        if (!isPasswordValid) {
          await AuditLogger.logFailure(
            user.org_id,
            email,
            'user.login',
            email,
            user.id,
            { reason: 'Invalid password' },
            request
          );
          throw ApiError.unauthorized('Invalid email or password');
        }
      } else {
        // No password stored for user: disallow legacy login
        throw ApiError.unauthorized('Legacy password authentication is disabled; use Keycloak');
      }

      // Extract permissions
      const permissions = user.roles?.role_permissions?.map(
        (rp: any) => rp.permission
      ) || [];

      // Generate JWT token
      const secret: Secret = process.env.JWT_SECRET as Secret;
      const options: any = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
      const token = jwt.sign(
        {
          id: user.id,
          email: user.email,
          orgId: user.org_id,
          roleId: user.role_id,
          permissions,
        },
        secret,
        options,
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

    // The users table in this schema does not include a password column.
    // If password storage is added in future, hash and store it here.

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

    const secret2: Secret = process.env.JWT_SECRET as Secret;
    const options2: any = { expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        orgId: user.org_id,
        roleId: user.role_id,
      },
      secret2,
      options2,
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
