import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class InvoiceService {
  async create(data: any, orgId: string) {
    // Verify customer belongs to org
    const customer = await prisma.customers.findFirst({
      where: {
        id: data.customer_id,
        org_id: orgId,
      },
    });

    if (!customer) {
      throw ApiError.badRequest('Invalid customer ID or customer does not belong to your organization');
    }

    // Check for duplicate invoice number
    const existingInvoice = await prisma.invoices.findUnique({
      where: { invoice_number: data.invoice_number },
    });

    if (existingInvoice) {
      throw ApiError.conflict('Invoice number already exists');
    }

    // Verify payment method belongs to customer if provided
    if (data.payment_method_id) {
      const paymentMethod = await prisma.payment_methods.findFirst({
        where: {
          id: data.payment_method_id,
          customer_id: data.customer_id,
        },
      });

      if (!paymentMethod) {
        throw ApiError.badRequest('Invalid payment method ID or payment method does not belong to the customer');
      }
    }

    // Calculate total
    const subtotal = data.subtotal || 0;
    const taxAmount = data.tax_amount || 0;
    const creditsApplied = data.credits_applied || 0;
    const total = subtotal + taxAmount - creditsApplied;

    try {
      return await prisma.invoices.create({
        data: {
          invoice_number: data.invoice_number,
          customer_id: data.customer_id,
          issue_date: new Date(data.issue_date),
          due_date: new Date(data.due_date),
          paid_date: data.paid_date ? new Date(data.paid_date) : null,
          subtotal,
          tax_amount: taxAmount,
          tax_rate: data.tax_rate || 0,
          total,
          credits_applied: creditsApplied,
          currency: data.currency || 'USD',
          payment_method_id: data.payment_method_id || null,
          status: data.status || 'draft',
          notes: data.notes || null,
        },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payment_methods: {
            select: {
              id: true,
              method_type: true,
              last4: true,
            },
          },
          invoice_line_items: {
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw ApiError.badRequest('Invalid customer or payment method ID');
      }
      throw error;
    }
  }

  async findAll(orgId: string, page = 1, limit = 10, filters?: any) {
    const skip = (page - 1) * limit;
    const where: any = {
      customers: {
        org_id: orgId,
      },
    };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.customer_id) {
      where.customer_id = filters.customer_id;
    }
    if (filters?.invoice_number) {
      where.invoice_number = {
        contains: filters.invoice_number,
        mode: 'insensitive',
      };
    }
    if (filters?.date_from) {
      where.issue_date = {
        gte: new Date(filters.date_from),
      };
    }
    if (filters?.date_to) {
      where.issue_date = {
        ...where.issue_date,
        lte: new Date(filters.date_to),
      };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payment_methods: {
            select: {
              id: true,
              method_type: true,
              last4: true,
            },
          },
        },
      }),
      prisma.invoices.count({ where }),
    ]);

    return { invoices, total, page, limit };
  }

  async findById(id: string, orgId: string) {
    const invoice = await prisma.invoices.findFirst({
      where: {
        id,
        customers: {
          org_id: orgId,
        },
      },
      include: {
        customers: {
          select: {
            id: true,
            name: true,
            email: true,
            mrr: true,
          },
        },
        payment_methods: {
          select: {
            id: true,
            method_type: true,
            last4: true,
            brand: true,
          },
        },
        invoice_line_items: {
          orderBy: {
            sort_order: 'asc',
          },
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            payment_date: true,
          },
        },
      },
    });

    if (!invoice) {
      throw ApiError.notFound('Invoice not found');
    }

    return invoice;
  }

  async update(id: string, data: any, orgId: string) {
    // Check if invoice exists and belongs to org
    const existingInvoice = await this.findById(id, orgId);

    // Check for invoice number conflict if being updated
    if (data.invoice_number && data.invoice_number !== existingInvoice.invoice_number) {
      const duplicateInvoice = await prisma.invoices.findUnique({
        where: { invoice_number: data.invoice_number },
      });

      if (duplicateInvoice) {
        throw ApiError.conflict('Invoice number already exists');
      }
    }

    // Verify payment method if being updated
    if (data.payment_method_id) {
      const paymentMethod = await prisma.payment_methods.findFirst({
        where: {
          id: data.payment_method_id,
          customer_id: existingInvoice.customer_id,
        },
      });

      if (!paymentMethod) {
        throw ApiError.badRequest('Invalid payment method ID or payment method does not belong to the customer');
      }
    }

    // Recalculate total if amounts changed
    let updateData: any = {};
    
    // Convert date strings to Date objects if provided
    if (data.issue_date) {
      updateData.issue_date = new Date(data.issue_date);
    }
    if (data.due_date) {
      updateData.due_date = new Date(data.due_date);
    }
    if (data.paid_date) {
      updateData.paid_date = new Date(data.paid_date);
    }
    
    // Copy other fields
    if (data.invoice_number !== undefined) updateData.invoice_number = data.invoice_number;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.payment_method_id !== undefined) updateData.payment_method_id = data.payment_method_id;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.tax_rate !== undefined) updateData.tax_rate = data.tax_rate;
    
    if (data.subtotal !== undefined || data.tax_amount !== undefined || data.credits_applied !== undefined) {
      const subtotal = data.subtotal !== undefined ? data.subtotal : existingInvoice.subtotal;
      const taxAmount = data.tax_amount !== undefined ? data.tax_amount : existingInvoice.tax_amount;
      const creditsApplied = data.credits_applied !== undefined ? data.credits_applied : existingInvoice.credits_applied;
      updateData.total = subtotal + taxAmount - creditsApplied;
      
      if (data.subtotal !== undefined) updateData.subtotal = data.subtotal;
      if (data.tax_amount !== undefined) updateData.tax_amount = data.tax_amount;
      if (data.credits_applied !== undefined) updateData.credits_applied = data.credits_applied;
    }

    try {
      return await prisma.invoices.update({
        where: { id },
        data: updateData,
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          payment_methods: {
            select: {
              id: true,
              method_type: true,
              last4: true,
            },
          },
          invoice_line_items: {
            orderBy: {
              sort_order: 'asc',
            },
          },
        },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Invoice not found');
      }
      throw error;
    }
  }

  async delete(id: string, orgId: string) {
    // Check if invoice exists and belongs to org
    await this.findById(id, orgId);

    try {
      await prisma.invoices.delete({
        where: { id },
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw ApiError.notFound('Invoice not found');
      }
      throw error;
    }
  }

  async findByCustomer(customerId: string, orgId: string, page = 1, limit = 10, filters?: any) {
    // Verify customer belongs to org
    const customer = await prisma.customers.findFirst({
      where: {
        id: customerId,
        org_id: orgId,
      },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found or does not belong to your organization');
    }

    const skip = (page - 1) * limit;
    const where: any = {
      customer_id: customerId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.invoice_number) {
      where.invoice_number = {
        contains: filters.invoice_number,
        mode: 'insensitive',
      };
    }
    if (filters?.date_from) {
      where.issue_date = {
        gte: new Date(filters.date_from),
      };
    }
    if (filters?.date_to) {
      where.issue_date = {
        ...where.issue_date,
        lte: new Date(filters.date_to),
      };
    }

    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoice_line_items: true,
        },
      }),
      prisma.invoices.count({ where }),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }
}

export default new InvoiceService();