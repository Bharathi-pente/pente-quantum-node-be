import prisma from '../config/database';
import ApiError from '../utils/ApiError';
import emailTemplateService from './email-template.service';

export interface DunningPolicyData {
  org_id: string;
  name: string;
  is_default?: boolean;
  status?: string;
  retry_schedule?: any[];
}

export interface DunningStepData {
  policy_id: string;
  day_offset: number;
  action: string;
  template_name?: string;
  subject?: string;
  assignee?: string;
  escalate_to?: string;
  grace_period_days?: number;
  sort_order?: number;
}

export class DunningService {
  async getPolicies(orgId: string) {
    return await prisma.dunning_policies.findMany({
      where: { org_id: orgId },
      include: {
        dunning_steps: {
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getPolicyById(id: string, orgId: string) {
    const policy = await prisma.dunning_policies.findFirst({
      where: { id, org_id: orgId },
      include: {
        dunning_steps: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });

    if (!policy) {
      throw ApiError.notFound('Dunning policy not found');
    }

    return policy;
  }

  async createPolicy(data: DunningPolicyData) {
    const { org_id, name, is_default, status, retry_schedule } = data;

    // If setting as default, unset other defaults
    if (is_default) {
      await prisma.dunning_policies.updateMany({
        where: { org_id },
        data: { is_default: false },
      });
    }

    return await prisma.dunning_policies.create({
      data: {
        org_id,
        name,
        is_default: is_default || false,
        status: status || 'active',
        retry_schedule: retry_schedule || [],
      },
      include: {
        dunning_steps: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  async updatePolicy(id: string, orgId: string, data: Partial<DunningPolicyData>) {
    // If setting as default, unset other defaults
    if (data.is_default) {
      await prisma.dunning_policies.updateMany({
        where: { org_id: orgId },
        data: { is_default: false },
      });
    }

    return await prisma.dunning_policies.update({
      where: { id },
      data,
      include: {
        dunning_steps: {
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  async deletePolicy(id: string) {
    await prisma.dunning_policies.delete({
      where: { id },
    });

    return { message: 'Dunning policy deleted successfully' };
  }

  async createStep(data: DunningStepData) {
    const { policy_id, day_offset, action, template_name, subject, assignee, escalate_to, grace_period_days, sort_order } = data;

    // Get max sort_order for this policy
    const maxSortOrder = await prisma.dunning_steps.findFirst({
      where: { policy_id },
      orderBy: { sort_order: 'desc' },
      select: { sort_order: true },
    });

    const nextSortOrder = (maxSortOrder?.sort_order || 0) + 1;

    const created = await prisma.dunning_steps.create({
      data: {
        policy_id,
        day_offset,
        action,
        template_name,
        subject,
        assignee,
        escalate_to,
        grace_period_days: grace_period_days || 0,
        sort_order: sort_order || nextSortOrder,
      },
    });

    // Increment template usage count if a template was attached
    if (template_name) {
      // need org_id for template usage tracking
      const policy = await prisma.dunning_policies.findUnique({ where: { id: policy_id } });
      if (policy) {
        await emailTemplateService.incrementUsageCount(template_name, policy.org_id);
      }
    }

    return created;
  }

  async updateStep(id: string, policyId: string, data: Partial<DunningStepData>) {
    const step = await prisma.dunning_steps.findFirst({
      where: { id, policy_id: policyId },
    });

    if (!step) {
      throw ApiError.notFound('Dunning step not found');
    }

    // If template_name is being changed, update usage counts accordingly
    const prevTemplate = step.template_name;
    const newTemplate = data.template_name;

    const updated = await prisma.dunning_steps.update({ where: { id }, data });

    if (prevTemplate !== newTemplate) {
      const policy = await prisma.dunning_policies.findUnique({ where: { id: policyId } });
      if (policy) {
        if (prevTemplate) {
          await emailTemplateService.decrementUsageCount(prevTemplate, policy.org_id);
        }
        if (newTemplate) {
          await emailTemplateService.incrementUsageCount(newTemplate, policy.org_id);
        }
      }
    }

    return updated;
  }

  async deleteStep(id: string, policyId: string) {
    const step = await prisma.dunning_steps.findFirst({
      where: { id, policy_id: policyId },
    });

    if (!step) {
      throw ApiError.notFound('Dunning step not found');
    }

    await prisma.dunning_steps.delete({ where: { id } });

    // Decrement template usage if this step referenced a template
    if (step.template_name) {
      const policy = await prisma.dunning_policies.findUnique({ where: { id: policyId } });
      if (policy) {
        await emailTemplateService.decrementUsageCount(step.template_name, policy.org_id);
      }
    }

    return { message: 'Dunning step deleted successfully' };
  }

  async getOverdueInvoices(orgId: string) {
    const now = new Date();
    const invoices = await prisma.invoices.findMany({
      where: {
        customers: { org_id: orgId },
        status: { in: ['pending', 'overdue'] },
        due_date: {
          lt: now,
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
      },
      orderBy: { due_date: 'asc' },
    });

    // Map to frontend-friendly format
    return invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.invoice_number,
      customerId: invoice.customer_id,
      customerName: invoice.customers?.name || 'Unknown Customer',
      customerEmail: invoice.customers?.email || '',
      status: invoice.status,
      issueDate: invoice.issue_date.toISOString(),
      dueDate: invoice.due_date.toISOString(),
      paidDate: invoice.paid_date?.toISOString() || null,
      subtotal: parseFloat(invoice.subtotal.toString()),
      credits: parseFloat((invoice.credits_applied || 0).toString()),
      tax: parseFloat((invoice.tax_amount || 0).toString()),
      taxRate: parseFloat((invoice.tax_rate || 0).toString()),
      total: parseFloat(invoice.total.toString()),
      currency: invoice.currency || 'USD',
      dunning_step: invoice.dunning_step || 0,
      notes: invoice.notes || '',
    }));
  }
}

export default new DunningService();