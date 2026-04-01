import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import emailTemplateService from '../services/email-template.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: EmailTemplates
 *   description: Email template management for dunning notifications
 */

export class EmailTemplateController {
  /**
   * @swagger
   * /email-templates:
   *   get:
   *     summary: Get all email templates for organization
   *     tags: [EmailTemplates]
   *     responses:
   *       200:
   *         description: List of email templates
   */
  getTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const templates = await emailTemplateService.getTemplates(orgId);
    return res.status(200).json(ApiResponse.success(templates, 'Email templates retrieved successfully'));
  });

  /**
   * @swagger
   * /email-templates/{id}:
   *   get:
   *     summary: Get email template by ID
   *     tags: [EmailTemplates]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Email template details
   */
  getTemplateById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const template = await emailTemplateService.getTemplateById(id, orgId);
    return res.status(200).json(ApiResponse.success(template, 'Email template retrieved successfully'));
  });

  /**
   * @swagger
   * /email-templates:
   *   post:
   *     summary: Create a new email template
   *     tags: [EmailTemplates]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - template_id
   *               - subject
   *               - html_content
   *             properties:
   *               name:
   *                 type: string
   *               template_id:
   *                 type: string
   *               subject:
   *                 type: string
   *               html_content:
   *                 type: string
   *               text_content:
   *                 type: string
   *               variables:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: Email template created
   */
  createTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const templateData = {
      ...req.body,
      org_id: orgId,
    };

    const template = await emailTemplateService.createTemplate(templateData);
    return res.status(201).json(ApiResponse.success(template, 'Email template created successfully'));
  });

  /**
   * @swagger
   * /email-templates/{id}:
   *   put:
   *     summary: Update an email template
   *     tags: [EmailTemplates]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *     responses:
   *       200:
   *         description: Email template updated
   */
  updateTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const template = await emailTemplateService.updateTemplate(id, orgId, req.body);
    return res.status(200).json(ApiResponse.success(template, 'Email template updated successfully'));
  });

  /**
   * @swagger
   * /email-templates/{id}:
   *   delete:
   *     summary: Delete an email template
   *     tags: [EmailTemplates]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Email template deleted
   */
  deleteTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    await emailTemplateService.deleteTemplate(id, orgId);
    return res.status(200).json(ApiResponse.success(null, 'Email template deleted successfully'));
  });

  /**
   * @swagger
   * /email-templates/{id}/preview:
   *   post:
   *     summary: Preview email template with sample data
   *     tags: [EmailTemplates]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               variables:
   *                 type: object
   *     responses:
   *       200:
   *         description: Rendered email preview
   */
  previewTemplate = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId;
    if (!orgId) {
      return res.status(400).json(ApiResponse.error('Organization ID not found'));
    }

    const template = await emailTemplateService.getTemplateById(id, orgId);
    const rendered = await emailTemplateService.renderTemplate(template.template_id, orgId, req.body.variables || {});
    
    return res.status(200).json(ApiResponse.success(rendered, 'Email template preview generated successfully'));
  });
}

export default new EmailTemplateController();
