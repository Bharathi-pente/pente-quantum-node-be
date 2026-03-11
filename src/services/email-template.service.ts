import prisma from '../config/database';
import ApiError from '../utils/ApiError';

export interface EmailTemplateData {
  org_id: string;
  name: string;
  template_id: string;
  subject: string;
  html_content: string;
  text_content?: string;
  variables?: string[];
}

export class EmailTemplateService {
  async getTemplates(orgId: string) {
    const templates = await prisma.email_templates.findMany({
      where: { org_id: orgId },
      orderBy: { created_at: 'desc' },
    });

    // Compute usage counts from dunning steps for accurate data
    const results = await Promise.all(
      templates.map(async (t) => {
        const used_in = await prisma.dunning_steps.count({
          where: {
            template_name: t.template_id,
            dunning_policies: {
              org_id: orgId,
            },
          },
        });
        return { ...t, used_in };
      }),
    );

    return results;
  }

  async getTemplateById(id: string, orgId: string) {
    const template = await prisma.email_templates.findFirst({
      where: { id, org_id: orgId },
    });

    if (!template) {
      throw ApiError.notFound('Email template not found');
    }

    return template;
  }

  async getTemplateByTemplateId(templateId: string, orgId: string) {
    const template = await prisma.email_templates.findFirst({
      where: { template_id: templateId, org_id: orgId },
    });

    if (!template) {
      throw ApiError.notFound('Email template not found');
    }

    return template;
  }

  async createTemplate(data: EmailTemplateData) {
    const { org_id, name, template_id, subject, html_content, text_content, variables } = data;

    // Check if template_id already exists
    const existing = await prisma.email_templates.findFirst({
      where: { template_id, org_id },
    });

    if (existing) {
      throw ApiError.badRequest('Template ID already exists');
    }

    return await prisma.email_templates.create({
      data: {
        org_id,
        name,
        template_id,
        subject,
        html_content,
        text_content,
        variables: variables || [],
        used_in: 0,
      },
    });
  }

  async updateTemplate(id: string, org_id: string, data: Partial<EmailTemplateData>) {
    const template = await prisma.email_templates.findFirst({
      where: { id, org_id },
    });

    if (!template) {
      throw ApiError.notFound('Email template not found');
    }

    // If updating template_id, check for conflicts
    if (data.template_id && data.template_id !== template.template_id) {
      const existing = await prisma.email_templates.findFirst({
        where: { template_id: data.template_id, org_id },
      });

      if (existing) {
        throw ApiError.badRequest('Template ID already exists');
      }
    }

    return await prisma.email_templates.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async deleteTemplate(id: string, org_id: string) {
    const template = await prisma.email_templates.findFirst({
      where: { id, org_id },
    });

    if (!template) {
      throw ApiError.notFound('Email template not found');
    }

    // Check if template is in use
    if (template.used_in > 0) {
      throw ApiError.badRequest('Cannot delete template that is in use by dunning policies');
    }

    await prisma.email_templates.delete({
      where: { id },
    });

    return { message: 'Email template deleted successfully' };
  }

  async renderTemplate(templateId: string, orgId: string, variables: Record<string, any>): Promise<{ subject: string; html: string; text?: string }> {
    const template = await this.getTemplateByTemplateId(templateId, orgId);

    // Replace variables in subject and content
    let subject = template.subject;
    let html = template.html_content;
    let text = template.text_content || '';

    // First, convert literal \n strings to actual newlines
    html = html.replace(/\\n/g, '\n');
    if (text) {
      text = text.replace(/\\n/g, '\n');
    }

    // Replace template variables
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      subject = subject.replace(regex, String(value));
      html = html.replace(regex, String(value));
      if (text) {
        text = text.replace(regex, String(value));
      }
    });

    return { subject, html, text: text || undefined };
  }

  async incrementUsageCount(templateId: string, orgId: string) {
    await prisma.email_templates.updateMany({
      where: { template_id: templateId, org_id: orgId },
      data: {
        used_in: {
          increment: 1,
        },
      },
    });
  }

  async decrementUsageCount(templateId: string, orgId: string) {
    await prisma.email_templates.updateMany({
      where: { template_id: templateId, org_id: orgId },
      data: {
        used_in: {
          decrement: 1,
        },
      },
    });
  }
}

export default new EmailTemplateService();
