import { Router } from 'express';
import orgPaymentController from '../controllers/orgPayment.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import { createOrgPaymentSchema, updateOrgPaymentSchema, getOrgPaymentSchema, getOrgPaymentsQuerySchema } from '../validators/orgPayment.validator';

const router = Router();

/**
 * @swagger
 * /org-payments:
 *   post:
 *     summary: Create a new organization payment
 *     tags: [Organization Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrgPayment'
 *     responses:
 *       201:
 *         description: Organization payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrgPaymentResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', authenticateKeycloak, validate(createOrgPaymentSchema), orgPaymentController.create);

/**
 * @swagger
 * /org-payments:
 *   get:
 *     summary: Get all organization payments
 *     tags: [Organization Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [succeeded, failed, pending, refunded]
 *         description: Filter by status
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *         description: Filter by payment method
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter from payment date
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter to payment date
 *     responses:
 *       200:
 *         description: List of organization payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrgPayment'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/', authenticateKeycloak, validate(getOrgPaymentsQuerySchema), orgPaymentController.getAll);

/**
 * @swagger
 * /org-payments/{id}:
 *   get:
 *     summary: Get organization payment by ID
 *     tags: [Organization Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization payment ID
 *     responses:
 *       200:
 *         description: Organization payment details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrgPaymentResponse'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Organization payment not found
 */
router.get('/:id', authenticateKeycloak, validate(getOrgPaymentSchema), orgPaymentController.getById);

/**
 * @swagger
 * /org-payments/{id}:
 *   put:
 *     summary: Update organization payment
 *     tags: [Organization Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrgPayment'
 *     responses:
 *       200:
 *         description: Organization payment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrgPaymentResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Organization payment not found
 */
router.put('/:id', authenticateKeycloak, validate(updateOrgPaymentSchema), orgPaymentController.update);

/**
 * @swagger
 * /org-payments/{id}:
 *   delete:
 *     summary: Delete organization payment
 *     tags: [Organization Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization payment ID
 *     responses:
 *       200:
 *         description: Organization payment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: null
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Organization payment not found
 */
router.delete('/:id', authenticateKeycloak, validate(getOrgPaymentSchema), orgPaymentController.delete);

export default router;