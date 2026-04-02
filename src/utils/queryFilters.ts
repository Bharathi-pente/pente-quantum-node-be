/**
 * Query Filter Utilities
 * Provides consistent data isolation filters for multi-tenant queries
 * 
 * Usage:
 * - Apply filters in Prisma queries to ensure org-scoped data access
 * - Super admins bypass org filters to see all data
 * - Regular users only see their organization's data
 */

import { OrgContext } from '@/middleware/orgContext.middleware';

/**
 * Apply organization filter to Prisma queries
 * 
 * @param orgContext - Organization context from request
 * @param includeOrgId - Whether to filter by org_id (default: true)
 * @returns Prisma where clause for org filtering
 * 
 * @example
 * ```typescript
 * const customers = await prisma.customers.findMany({
 *   where: {
 *     ...applyOrgFilter(req.orgContext),
 *     status: 'active'
 *   }
 * });
 * ```
 */
export function applyOrgFilter(
  orgContext: OrgContext | undefined,
  includeOrgId: boolean = true
) {
  if (!orgContext) {
    throw new Error('Organization context required for query filtering');
  }

  // Super admins can see all data
  if (orgContext.isSuperAdmin) {
    return {};
  }

  // Regular users only see their org's data
  if (includeOrgId && orgContext.orgId) {
    return { org_id: orgContext.orgId };
  }

  return {};
}

/**
 * Apply customer filter with org isolation
 * Customers are org-scoped, so this filters by org_id
 * 
 * @example
 * ```typescript
 * const customers = await prisma.customers.findMany({
 *   where: applyCustomerFilter(req.orgContext)
 * });
 * ```
 */
export function applyCustomerFilter(orgContext: OrgContext | undefined) {
  return applyOrgFilter(orgContext);
}

/**
 * Apply invoice filter
 * Invoices are accessed via customers, so we filter through customer relationship
 * 
 * @example
 * ```typescript
 * const invoices = await prisma.invoices.findMany({
 *   where: applyInvoiceFilter(req.orgContext)
 * });
 * ```
 */
export function applyInvoiceFilter(orgContext: OrgContext | undefined) {
  if (!orgContext) {
    throw new Error('Organization context required');
  }

  // Super admin sees all invoices
  if (orgContext.isSuperAdmin) {
    return {};
  }

  // Regular users see invoices for their org's customers only
  return {
    customer: {
      org_id: orgContext.orgId,
    },
  };
}

/**
 * Apply product filter with org isolation
 * 
 * @example
 * ```typescript
 * const products = await prisma.products.findMany({
 *   where: applyProductFilter(req.orgContext)
 * });
 * ```
 */
export function applyProductFilter(orgContext: OrgContext | undefined) {
  return applyOrgFilter(orgContext);
}

/**
 * Apply meter filter with org isolation
 * 
 * @example
 * ```typescript
 * const meters = await prisma.meters.findMany({
 *   where: applyMeterFilter(req.orgContext)
 * });
 * ```
 */
export function applyMeterFilter(orgContext: OrgContext | undefined) {
  return applyOrgFilter(orgContext);
}

/**
 * Apply contract filter
 * Contracts are accessed via customers
 * 
 * @example
 * ```typescript
 * const contracts = await prisma.contracts.findMany({
 *   where: applyContractFilter(req.orgContext)
 * });
 * ```
 */
export function applyContractFilter(orgContext: OrgContext | undefined) {
  if (!orgContext) {
    throw new Error('Organization context required');
  }

  if (orgContext.isSuperAdmin) {
    return {};
  }

  return {
    customer: {
      org_id: orgContext.orgId,
    },
  };
}

/**
 * Apply payment filter
 * Payments are accessed via customers
 */
export function applyPaymentFilter(orgContext: OrgContext | undefined) {
  if (!orgContext) {
    throw new Error('Organization context required');
  }

  if (orgContext.isSuperAdmin) {
    return {};
  }

  return {
    customer: {
      org_id: orgContext.orgId,
    },
  };
}

/**
 * Apply credit filter
 * Credits are accessed via customers
 */
export function applyCreditFilter(orgContext: OrgContext | undefined) {
  if (!orgContext) {
    throw new Error('Organization context required');
  }

  if (orgContext.isSuperAdmin) {
    return {};
  }

  return {
    customer: {
      org_id: orgContext.orgId,
    },
  };
}

/**
 * Check if user can access a specific resource
 * 
 * @param orgContext - Organization context
 * @param resourceOrgId - The org_id of the resource being accessed
 * @returns true if user can access the resource
 * 
 * @example
 * ```typescript
 * const customer = await prisma.customers.findUnique({ where: { id }});
 * if (!canAccessResource(req.orgContext, customer.org_id)) {
 *   throw new Error('Access denied');
 * }
 * ```
 */
export async function canAccessResource(
  orgContext: OrgContext | undefined,
  resourceOrgId: string | null
): Promise<boolean> {
  if (!orgContext) {
    return false;
  }

  // Super admin can access everything
  if (orgContext.isSuperAdmin) {
    return true;
  }

  // Regular users can only access their org's resources
  return orgContext.orgId === resourceOrgId;
}

/**
 * Validate org access and throw error if denied
 * 
 * @param orgContext - Organization context
 * @param resourceOrgId - The org_id of the resource
 * @throws Error if access is denied
 * 
 * @example
 * ```typescript
 * const customer = await prisma.customers.findUnique({ where: { id }});
 * validateOrgAccess(req.orgContext, customer.org_id);
 * // Continues only if access is allowed
 * ```
 */
export async function validateOrgAccess(
  orgContext: OrgContext | undefined,
  resourceOrgId: string | null
): Promise<void> {
  const hasAccess = await canAccessResource(orgContext, resourceOrgId);

  if (!hasAccess) {
    throw new Error(
      'Access denied: You do not have permission to access this resource'
    );
  }
}

/**
 * Get org-specific filter for related resources
 * Use this when you need to filter based on a relationship
 * 
 * @example
 * ```typescript
 * // Get invoices for customers in user's org
 * const invoices = await prisma.invoices.findMany({
 *   where: {
 *     customer: getOrgRelationFilter(req.orgContext)
 *   }
 * });
 * ```
 */
export function getOrgRelationFilter(orgContext: OrgContext | undefined) {
  if (!orgContext) {
    throw new Error('Organization context required');
  }

  if (orgContext.isSuperAdmin) {
    return {};
  }

  return {
    org_id: orgContext.orgId,
  };
}

/**
 * Apply user filter with org isolation
 * For listing users in the same organization
 * 
 * @example
 * ```typescript
 * const orgUsers = await prisma.users.findMany({
 *   where: applyUserFilter(req.orgContext)
 * });
 * ```
 */
export function applyUserFilter(orgContext: OrgContext | undefined) {
  if (!orgContext) {
    throw new Error('Organization context required');
  }

  // Super admin sees all users
  if (orgContext.isSuperAdmin) {
    return {};
  }

  // Regular users only see users in their org
  return {
    org_id: orgContext.orgId,
  };
}

/**
 * Helper to get org_id for creating new resources
 * Throws error if org context is missing
 * 
 * @example
 * ```typescript
 * const newCustomer = await prisma.customers.create({
 *   data: {
 *     org_id: getOrgIdForCreate(req.orgContext),
 *     name: 'New Customer',
 *     // ... other fields
 *   }
 * });
 * ```
 */
export function getOrgIdForCreate(orgContext: OrgContext | undefined): string {
  if (!orgContext) {
    throw new Error('Organization context required');
  }

  if (!orgContext.orgId) {
    throw new Error(
      'Cannot create org-scoped resource: User has no organization'
    );
  }

  return orgContext.orgId;
}
