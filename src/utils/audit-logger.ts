import prisma from '../config/database';

export interface AuditLogData {
  org_id: string;
  actor: string;
  actor_name?: string;
  action: string;
  resource_label?: string;
  resource_id?: string | null;
  ip_address?: string | null;
  user_agent?: string;
  status: 'success' | 'failed';
  details?: Record<string, any>;
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      await prisma.audit_logs.create({
        data: {
          org_id: data.org_id,
          actor: data.actor,
          actor_name: data.actor_name,
          action: data.action,
          resource_label: data.resource_label,
          resource_id: data.resource_id,
          ip_address: data.ip_address,
          user_agent: data.user_agent,
          status: data.status,
          details: data.details || {},
        },
      });
    } catch (error) {
      // Log audit logging errors but don't fail the main operation
      console.error('Failed to log audit event:', error);
    }
  }

  /**
   * Log a successful operation
   */
  static async logSuccess(
    org_id: string,
    actor: string,
    action: string,
    resource_label?: string,
    resource_id?: string | null,
    details?: Record<string, any>,
    request?: any
  ): Promise<void> {
    const ip_address = this.extractIpAddress(request);
    const user_agent = this.extractUserAgent(request);

    await this.log({
      org_id,
      actor,
      action,
      resource_label,
      resource_id,
      ip_address,
      user_agent,
      status: 'success',
      details,
    });
  }

  /**
   * Log a failed operation
   */
  static async logFailure(
    org_id: string,
    actor: string,
    action: string,
    resource_label?: string,
    resource_id?: string | null,
    details?: Record<string, any>,
    request?: any
  ): Promise<void> {
    const ip_address = this.extractIpAddress(request);
    const user_agent = this.extractUserAgent(request);

    await this.log({
      org_id,
      actor,
      action,
      resource_label,
      resource_id,
      ip_address,
      user_agent,
      status: 'failed',
      details,
    });
  }

  /**
   * Extract IP address from request
   */
  private static extractIpAddress(request: any): string | null {
    if (!request) return null;

    // Check various headers for IP address
    const ip = request.ip ||
               request.connection?.remoteAddress ||
               request.socket?.remoteAddress ||
               (request.headers && (
                 request.headers['x-forwarded-for'] ||
                 request.headers['x-real-ip'] ||
                 request.headers['cf-connecting-ip']
               ));

    // Handle comma-separated IPs (from x-forwarded-for)
    if (ip && typeof ip === 'string') {
      return ip.split(',')[0].trim();
    }

    return ip || null;
  }

  /**
   * Extract user agent from request
   */
  private static extractUserAgent(request: any): string | undefined {
    if (!request) return undefined;
    return request.headers?.['user-agent'] || request.get?.('User-Agent');
  }
}