/**
 * EXAMPLE: Customer Controller with Multi-Tenancy
 * 
 * This example shows how to properly implement org-scoped queries
 * using the query filter utilities.
 * 
 * Copy this pattern to all your controllers!
 */

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  applyCustomerFilter, 
  getOrgIdForCreate,
  canAccessResource 
} from '@/utils/queryFilters';
import { getOrgContext } from '@/middleware/orgContext.middleware';

const prisma = new PrismaClient();

// ============================================
// GET /api/customers - List all customers
// ============================================
export async function getCustomers(req: Request, res: Response): Promise<void> {
  try {
    const orgContext = getOrgContext(req);

    // Apply org filter automatically
    // - Super admin (billing-admin): sees ALL customers from ALL orgs
    // - Org admin (billing-org-admin): sees ONLY their org's customers
    // - Manager (billing-manager): sees ONLY their org's customers
    // - Viewer (billing-viewer): sees ONLY their org's customers
    const customers = await prisma.customers.findMany({
      where: {
        ...applyCustomerFilter(orgContext),
        // You can add additional filters here
        status: 'active', // Example: only active customers
      },
      include: {
        products: {
          select: {
            id: true,
            name: true,
            base_price: true,
          },
        },
        contracts: {
          where: { status: 'active' },
          select: {
            id: true,
            name: true,
            start_date: true,
            end_date: true,
            total_value: true,
          },
        },
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: customers,
      meta: {
        count: customers.length,
        orgId: orgContext.orgId,
        isSuperAdmin: orgContext.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customers',
    });
  }
}

// ============================================
// GET /api/customers/:id - Get single customer
// ============================================
export async function getCustomerById(req: Request, res: Response): Promise<void> {
  try {
    const orgContext = getOrgContext(req);
    const { id } = req.params;

    // Query with org filter
    // If customer is from different org, it will be filtered out
    const customer = await prisma.customers.findFirst({
      where: {
        id,
        ...applyCustomerFilter(orgContext),
      },
      include: {
        products: true,
        contracts: true,
        invoices: {
          orderBy: { created_at: 'desc' },
          take: 10, // Latest 10 invoices
        },
        organizations: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customer',
    });
  }
}

// ============================================
// POST /api/customers - Create new customer
// ============================================
export async function createCustomer(req: Request, res: Response): Promise<void> {
  try {
    const orgContext = getOrgContext(req);
    const { name, email, product_id } = req.body;

    // Validate required fields
    if (!name || !email) {
      res.status(400).json({
        success: false,
        message: 'Name and email are required',
      });
      return;
    }

    // Create customer with user's org_id
    // Super admins must explicitly specify org_id in request
    const customer = await prisma.customers.create({
      data: {
        org_id: getOrgIdForCreate(orgContext), // Automatically uses user's org
        name,
        email,
        product_id: product_id || null,
        status: 'active',
        mrr: 0,
        credit_balance: 0,
        health_score: 100,
        logo_initials: generateInitials(name),
      },
      include: {
        products: true,
        organizations: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: customer,
    });
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create customer',
    });
  }
}

// ============================================
// PUT /api/customers/:id - Update customer
// ============================================
export async function updateCustomer(req: Request, res: Response): Promise<void> {
  try {
    const orgContext = getOrgContext(req);
    const { id } = req.params;
    const { name, email, product_id, status } = req.body;

    // First, verify customer exists and user has access
    const existingCustomer = await prisma.customers.findFirst({
      where: {
        id,
        ...applyCustomerFilter(orgContext),
      },
    });

    if (!existingCustomer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    // Additional security check
    const hasAccess = await canAccessResource(orgContext, existingCustomer.org_id);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Update customer
    const updatedCustomer = await prisma.customers.update({
      where: { id },
      data: {
        name: name || existingCustomer.name,
        email: email || existingCustomer.email,
        product_id: product_id !== undefined ? product_id : existingCustomer.product_id,
        status: status || existingCustomer.status,
        updated_at: new Date(),
      },
      include: {
        products: true,
        organizations: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: updatedCustomer,
    });
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update customer',
    });
  }
}

// ============================================
// DELETE /api/customers/:id - Delete customer
// ============================================
export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  try {
    const orgContext = getOrgContext(req);
    const { id } = req.params;

    // Verify customer exists and user has access
    const customer = await prisma.customers.findFirst({
      where: {
        id,
        ...applyCustomerFilter(orgContext),
      },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    // Check access
    const hasAccess = await canAccessResource(orgContext, customer.org_id);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied',
      });
      return;
    }

    // Soft delete (update status)
    await prisma.customers.update({
      where: { id },
      data: {
        status: 'churned',
        updated_at: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Customer deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete customer',
    });
  }
}

// ============================================
// GET /api/customers/:id/invoices - Get customer invoices
// ============================================
export async function getCustomerInvoices(req: Request, res: Response): Promise<void> {
  try {
    const orgContext = getOrgContext(req);
    const { id } = req.params;

    // Verify customer access first
    const customer = await prisma.customers.findFirst({
      where: {
        id,
        ...applyCustomerFilter(orgContext),
      },
    });

    if (!customer) {
      res.status(404).json({
        success: false,
        message: 'Customer not found',
      });
      return;
    }

    // Get invoices for this customer
    const invoices = await prisma.invoices.findMany({
      where: {
        customer_id: id,
      },
      include: {
        invoice_line_items: true,
        payments: true,
      },
      orderBy: { created_at: 'desc' },
    });

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error('Error fetching customer invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch invoices',
    });
  }
}

// ============================================
// Helper Functions
// ============================================

function generateInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}

// ============================================
// IMPORTANT NOTES:
// ============================================
/*
1. ALWAYS use applyXXXFilter() functions in WHERE clauses
2. ALWAYS use getOrgContext(req) to access org context
3. NEVER trust org_id from request body - use getOrgIdForCreate()
4. For updates/deletes, ALWAYS verify access first
5. Super admins see all data, others see only their org
6. Use canAccessResource() for explicit access checks

Common Mistakes to Avoid:
❌ prisma.customers.findMany() - Missing org filter!
✅ prisma.customers.findMany({ where: applyCustomerFilter(orgContext) })

❌ org_id: req.body.org_id - User could fake this!
✅ org_id: getOrgIdForCreate(orgContext)

❌ Assuming user can access resource
✅ Check with canAccessResource() first
*/
