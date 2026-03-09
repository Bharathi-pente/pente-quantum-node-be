import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import { AuditLogger } from '../utils/audit-logger';

export class PaymentService {
  async create(data: any, orgId: string, request?: any) {
    // Validate invoice exists and belongs to org
    const invoice = await prisma.invoices.findFirst({
      where: {
        id: data.invoice_id,
        customers: {
          org_id: orgId,
        },
      },
      include: {
        customers: true,
      },
    });

    if (!invoice) {
      // Log failed payment attempt
      await AuditLogger.logFailure(
        orgId,
        request?.user?.email || 'unknown',
        'payment.create',
        `Payment for invoice ${data.invoice_id}`,
        null,
        { reason: 'Invoice not found', invoice_id: data.invoice_id },
        request
      );
      throw ApiError.notFound('Invoice not found');
    }

    // Validate payment method exists and belongs to customer
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id: data.payment_method_id,
        customer_id: invoice.customer_id,
      },
    });

    if (!paymentMethod) {
      // Log failed payment attempt
      await AuditLogger.logFailure(
        orgId,
        request?.user?.email || 'unknown',
        'payment.create',
        `Payment for invoice ${data.invoice_id}`,
        null,
        { reason: 'Payment method not found', payment_method_id: data.payment_method_id },
        request
      );
      throw ApiError.notFound('Payment method not found or does not belong to customer');
    }

    // Check if payment amount exceeds outstanding invoice amount
    const existingPayments = await prisma.payments.aggregate({
      where: {
        invoice_id: data.invoice_id,
        status: 'succeeded',
      },
      _sum: {
        amount: true,
      },
    });

    const paidAmount = existingPayments._sum.amount || 0;
    const outstandingAmount = Number(invoice.total) - Number(paidAmount);

    if (data.amount > outstandingAmount) {
      // Log failed payment attempt
      await AuditLogger.logFailure(
        orgId,
        request?.user?.email || 'unknown',
        'payment.create',
        `Payment for invoice ${data.invoice_id}`,
        null,
        {
          reason: 'Amount exceeds outstanding',
          amount: data.amount,
          outstanding: outstandingAmount
        },
        request
      );
      throw ApiError.badRequest(`Payment amount (${data.amount}) exceeds outstanding invoice amount (${outstandingAmount})`);
    }

    try {
      // Create payment
      const payment = await prisma.payments.create({
        data: {
          invoice_id: data.invoice_id,
          customer_id: invoice.customer_id,
          amount: data.amount,
          currency: data.currency || 'USD',
          status: 'pending',
          payment_method_id: data.payment_method_id,
          payment_date: data.payment_date ? new Date(data.payment_date) : new Date(),
          description: data.description,
        },
        include: {
          customers: true,
          invoices: true,
          payment_methods: true,
        },
      });

      // Log successful payment creation
      await AuditLogger.logSuccess(
        orgId,
        request?.user?.email || 'system',
        'payment.created',
        `Payment for ${invoice.invoice_number}`,
        payment.id,
        {
          amount: data.amount,
          currency: data.currency || 'USD',
          customer: invoice.customers.name,
          invoice_number: invoice.invoice_number,
          method: paymentMethod.method_type,
        },
        request
      );

      // If payment succeeds, update invoice status
      if (payment.status === 'succeeded' && payment.invoice_id) {
        await this.updateInvoiceStatus(payment.invoice_id);
      }

      return payment;
    } catch (error: any) {
      // Log failed payment creation
      await AuditLogger.logFailure(
        orgId,
        request?.user?.email || 'unknown',
        'payment.create',
        `Payment for invoice ${data.invoice_id}`,
        null,
        { error: error.message },
        request
      );
      throw error;
    }
  }

  async findAll(orgId: string, page: number = 1, limit: number = 10, filters: any = {}) {
    const skip = (page - 1) * limit;

    const where: any = {
      customers: {
        org_id: orgId,
      },
    };

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.customer_id) {
      where.customer_id = filters.customer_id;
    }

    if (filters.invoice_id) {
      where.invoice_id = filters.invoice_id;
    }

    if (filters.payment_method_id) {
      where.payment_method_id = filters.payment_method_id;
    }

    if (filters.date_from || filters.date_to) {
      where.payment_date = {};
      if (filters.date_from) {
        where.payment_date.gte = new Date(filters.date_from);
      }
      if (filters.date_to) {
        where.payment_date.lte = new Date(filters.date_to);
      }
    }

    const [payments, total] = await Promise.all([
      prisma.payments.findMany({
        where,
        include: {
          customers: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          invoices: {
            select: {
              id: true,
              invoice_number: true,
              total: true,
              status: true,
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
        },
        orderBy: {
          payment_date: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.payments.count({ where }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, orgId: string) {
    const payment = await prisma.payments.findFirst({
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
          },
        },
        invoices: {
          select: {
            id: true,
            invoice_number: true,
            total: true,
            status: true,
            issue_date: true,
            due_date: true,
          },
        },
        payment_methods: {
          select: {
            id: true,
            method_type: true,
            last4: true,
            brand: true,
            billing_name: true,
          },
        },
      },
    });

    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }

    return payment;
  }

  async update(id: string, data: any, orgId: string) {
    // Check if payment exists and belongs to org
    const existingPayment = await prisma.payments.findFirst({
      where: {
        id,
        customers: {
          org_id: orgId,
        },
      },
    });

    if (!existingPayment) {
      throw ApiError.notFound('Payment not found');
    }

    // Update payment
    const payment = await prisma.payments.update({
      where: { id },
      data: {
        status: data.status,
        payment_date: data.payment_date ? new Date(data.payment_date) : undefined,
        failure_reason: data.failure_reason,
        description: data.description,
      },
      include: {
        customers: true,
        invoices: true,
        payment_methods: true,
      },
    });

    // If payment status changed to succeeded, update invoice status
    if (data.status === 'succeeded' && existingPayment.status !== 'succeeded' && payment.invoice_id) {
      await this.updateInvoiceStatus(payment.invoice_id);
    }

    // If payment status changed from succeeded to something else, update invoice status
    if (data.status !== 'succeeded' && existingPayment.status === 'succeeded' && payment.invoice_id) {
      await this.updateInvoiceStatus(payment.invoice_id);
    }

    return payment;
  }

  async delete(id: string, orgId: string) {
    // Check if payment exists and belongs to org
    const payment = await prisma.payments.findFirst({
      where: {
        id,
        customers: {
          org_id: orgId,
        },
      },
    });

    if (!payment) {
      throw ApiError.notFound('Payment not found');
    }

    // Don't allow deletion of succeeded payments
    if (payment.status === 'succeeded') {
      throw ApiError.badRequest('Cannot delete a succeeded payment');
    }

    await prisma.payments.delete({
      where: { id },
    });

    return true;
  }

  private async updateInvoiceStatus(invoiceId: string) {
    // Calculate total paid amount
    const payments = await prisma.payments.aggregate({
      where: {
        invoice_id: invoiceId,
        status: 'succeeded',
      },
      _sum: {
        amount: true,
      },
    });

    const paidAmount = Number(payments._sum.amount || 0);

    // Get invoice total
    const invoice = await prisma.invoices.findUnique({
      where: { id: invoiceId },
      select: { total: true, status: true },
    });

    if (!invoice) return;

    let newStatus = invoice.status;

    if (paidAmount >= Number(invoice.total)) {
      newStatus = 'paid';
    } else if (paidAmount > 0) {
      newStatus = 'pending'; // Partially paid
    }

    // Update invoice status if changed
    if (newStatus !== invoice.status) {
      await prisma.invoices.update({
        where: { id: invoiceId },
        data: {
          status: newStatus,
          paid_date: newStatus === 'paid' ? new Date() : null,
        },
      });
    }
  }
}

export default new PaymentService();