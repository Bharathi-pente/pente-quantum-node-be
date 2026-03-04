import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export class PaymentMethodService {
  async create(data: any, customerId: string) {
    // Validate customer exists
    const customer = await prisma.customers.findUnique({
      where: { id: customerId },
      select: {
        id: true,
        org_id: true,
        name: true,
        email: true,
        product_id: true,
        status: true,
        mrr: true,
        credit_balance: true,
        health_score: true,
        logo_initials: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!customer) {
      throw ApiError.notFound('Customer not found');
    }

    const paymentMethod = await prisma.payment_methods.create({
      data: {
        customer_id: customerId,
        method_type: data.method_type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.exp_month,
        exp_year: data.exp_year,
        bank_name: data.bank_name,
        account_type: data.account_type,
        billing_name: data.billing_name,
        billing_address: data.billing_address,
        is_default: data.is_default || false,
        status: 'active',
      },
    });

    // If this is set as default, unset other default payment methods
    if (data.is_default) {
      await this.unsetOtherDefaults(customerId, paymentMethod.id);
    }

    return paymentMethod;
  }

  async findAll(customerId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [paymentMethods, total] = await Promise.all([
      prisma.payment_methods.findMany({
        where: {
          customer_id: customerId,
          status: 'active',
        },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      prisma.payment_methods.count({
        where: {
          customer_id: customerId,
          status: 'active',
        },
      }),
    ]);

    return { paymentMethods, total };
  }

  async findById(id: string, customerId: string) {
    const paymentMethod = await prisma.payment_methods.findFirst({
      where: {
        id,
        customer_id: customerId,
        status: 'active',
      },
    });

    if (!paymentMethod) {
      throw ApiError.notFound('Payment method not found');
    }

    return paymentMethod;
  }

  async update(id: string, customerId: string, data: any) {
    // Find the payment method first to ensure it exists and belongs to the customer
    await this.findById(id, customerId);

    const updated = await prisma.payment_methods.update({
      where: { id },
      data: {
        method_type: data.method_type,
        brand: data.brand,
        last4: data.last4,
        exp_month: data.exp_month,
        exp_year: data.exp_year,
        bank_name: data.bank_name,
        account_type: data.account_type,
        billing_name: data.billing_name,
        billing_address: data.billing_address,
        is_default: data.is_default,
        status: data.status,
      },
    });

    // If this is set as default, unset other default payment methods
    if (data.is_default) {
      await this.unsetOtherDefaults(customerId, id);
    }

    return updated;
  }

  async delete(id: string, customerId: string) {
    // Find the payment method first to ensure it exists and belongs to the customer
    await this.findById(id, customerId);

    // Check if payment method is used in any payments
    const paymentCount = await prisma.payments.count({
      where: { payment_method_id: id },
    });

    if (paymentCount > 0) {
      // Soft delete - mark as inactive
      await prisma.payment_methods.update({
        where: { id },
        data: { status: 'inactive' },
      });
    } else {
      // Hard delete if no payments
      await prisma.payment_methods.delete({
        where: { id },
      });
    }

    return { success: true };
  }

  async setDefault(id: string, customerId: string) {
    // Find the payment method first to ensure it exists and belongs to the customer
    await this.findById(id, customerId);

    // Unset all other defaults
    await this.unsetOtherDefaults(customerId);

    // Set this one as default
    const updated = await prisma.payment_methods.update({
      where: { id },
      data: { is_default: true },
    });

    return updated;
  }

  private async unsetOtherDefaults(customerId: string, excludeId?: string) {
    const where: any = {
      customer_id: customerId,
      is_default: true,
    };

    if (excludeId) {
      where.id = { not: excludeId };
    }

    await prisma.payment_methods.updateMany({
      where,
      data: { is_default: false },
    });
  }
}

const paymentMethodService = new PaymentMethodService();
export default paymentMethodService;