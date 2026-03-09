import { Router } from 'express';
import emailTemplateController from '../controllers/email-template.controller';
import { authenticateKeycloak, requireRole } from '../middleware/keycloakAuth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticateKeycloak);

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
router.post(
  '/',
  requireRole('admin', 'finance'),
  emailTemplateController.createTemplate
);

/**
 * @route   PUT /api/v1/email-templates/:id
 * @desc    Update email template
 * @access  Private (Admin/Finance)
 */
router.put(
  '/:id',
  requireRole('admin', 'finance'),
  emailTemplateController.updateTemplate
);

/**
 * @route   DELETE /api/v1/email-templates/:id
 * @desc    Delete email template
 * @access  Private (Admin)
 */
router.delete(
  '/:id',
  requireRole('admin'),
  emailTemplateController.deleteTemplate
);

/**
 * @route   POST /api/v1/email-templates/:id/preview
 * @desc    Preview email template with sample data
 * @access  Private
 */
router.post('/:id/preview', emailTemplateController.previewTemplate);

export default router;
