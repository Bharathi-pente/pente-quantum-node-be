import { Router } from 'express';
import orgPaymentMethodController from '../controllers/orgPaymentMethod.controller';
// import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createOrgPaymentMethodSchema,
  updateOrgPaymentMethodSchema,
  getOrgPaymentMethodSchema,
  getOrgPaymentMethodsQuerySchema
} from '../validators/orgPaymentMethod.validator';

const router = Router();

/**
 * @swagger
 * /org-payment-methods:
 *   post:
 *     summary: Create a new organization payment method
 *     tags: [Organization Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateOrgPaymentMethod'
 *     responses:
 *       201:
 *         description: Payment method created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrgPaymentMethodResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post('/', validate(createOrgPaymentMethodSchema), orgPaymentMethodController.create);

/**
 * @swagger
 * /org-payment-methods:
 *   get:
 *     summary: Get all organization payment methods
 *     tags: [Organization Payment Methods]
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
 *           enum: [active, inactive]
 *         description: Filter by status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by type
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and type
 *     responses:
 *       200:
 *         description: List of organization payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/OrgPaymentMethod'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', validate(getOrgPaymentMethodsQuerySchema), orgPaymentMethodController.getAll);

/**
 * @swagger
 * /org-payment-methods/{id}:
 *   get:
 *     summary: Get organization payment method by ID
 *     tags: [Organization Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization payment method ID
 *     responses:
 *       200:
 *         description: Organization payment method details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrgPaymentMethodResponse'
 *       404:
 *         description: Payment method not found
 */
router.get('/:id', validate(getOrgPaymentMethodSchema), orgPaymentMethodController.getById);

/**
 * @swagger
 * /org-payment-methods/{id}:
 *   put:
 *     summary: Update organization payment method
 *     tags: [Organization Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization payment method ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateOrgPaymentMethod'
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/OrgPaymentMethodResponse'
 *       404:
 *         description: Payment method not found
 */
router.put('/:id', validate(updateOrgPaymentMethodSchema), orgPaymentMethodController.update);

/**
 * @swagger
 * /org-payment-methods/{id}:
 *   delete:
 *     summary: Delete organization payment method
 *     tags: [Organization Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Organization payment method ID
 *     responses:
 *       204:
 *         description: Payment method deleted successfully
 *       404:
 *         description: Payment method not found
 *       409:
 *         description: Cannot delete payment method in use
 */
router.delete('/:id', validate(getOrgPaymentMethodSchema), orgPaymentMethodController.delete);

export default router;