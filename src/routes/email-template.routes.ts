import { Router } from 'express';
import emailTemplateController from '../controllers/email-template.controller';

const router = Router();

// Keycloak authentication removed — routes are unprotected by Keycloak

/**
 * @route   GET /api/v1/email-templates
 * @desc    Get all email templates
 * @access  Private
 */
router.get('/', emailTemplateController.getTemplates);

/**
 * @route   GET /api/v1/email-templates/:id
 * @desc    Get email template by ID
 * @access  Private
 */
router.get('/:id', emailTemplateController.getTemplateById);

/**
 * @route   POST /api/v1/email-templates
 * @desc    Create email template
 * @access  Private (Admin/Finance)
 */
router.post('/', emailTemplateController.createTemplate);

/**
 * @route   PUT /api/v1/email-templates/:id
 * @desc    Update email template
 * @access  Private (Admin/Finance)
 */
router.put('/:id', emailTemplateController.updateTemplate);

/**
 * @route   DELETE /api/v1/email-templates/:id
 * @desc    Delete email template
 * @access  Private (Admin)
 */
router.delete('/:id', emailTemplateController.deleteTemplate);

/**
 * @route   POST /api/v1/email-templates/:id/preview
 * @desc    Preview email template with sample data
 * @access  Private
 */
router.post('/:id/preview', emailTemplateController.previewTemplate);

export default router;
