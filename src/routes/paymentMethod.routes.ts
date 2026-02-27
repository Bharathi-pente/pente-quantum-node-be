import { Router } from 'express';
import { PaymentMethodController } from '../controllers/paymentMethod.controller';
import { authenticateKeycloak } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createPaymentMethodSchema,
  updatePaymentMethodSchema,
  getPaymentMethodSchema,
  getPaymentMethodsQuerySchema,
} from '../validators/paymentMethod.validator';

const router = Router();
const paymentMethodController = new PaymentMethodController();

/**
 * @swagger
 * /payment-methods:
 *   post:
 *     summary: Create a new payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePaymentMethod'
 *     responses:
 *       201:
 *         description: Payment method created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethodResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Customer not found
 */
router.post('/', authenticateKeycloak, validate(createPaymentMethodSchema), paymentMethodController.create);

/**
 * @swagger
 * /payment-methods:
 *   get:
 *     summary: Get all payment methods for customer
 *     tags: [Payment Methods]
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
 *     responses:
 *       200:
 *         description: List of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     paymentMethods:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PaymentMethod'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         pages:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: "Payment methods retrieved successfully"
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateKeycloak, validate(getPaymentMethodsQuerySchema), paymentMethodController.getAll);

/**
 * @swagger
 * /payment-methods/{id}:
 *   get:
 *     summary: Get payment method by ID
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethodResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment method not found
 */
router.get('/:id', authenticateKeycloak, validate(getPaymentMethodSchema), paymentMethodController.getById);

/**
 * @swagger
 * /payment-methods/{id}:
 *   put:
 *     summary: Update payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment method ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdatePaymentMethod'
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethodResponse'
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment method not found
 */
router.put('/:id', authenticateKeycloak, validate(updatePaymentMethodSchema), paymentMethodController.update);

/**
 * @swagger
 * /payment-methods/{id}:
 *   delete:
 *     summary: Delete payment method
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: null
 *                 message:
 *                   type: string
 *                   example: "Payment method deleted successfully"
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment method not found
 */
router.delete('/:id', authenticateKeycloak, validate(getPaymentMethodSchema), paymentMethodController.delete);

/**
 * @swagger
 * /payment-methods/{id}/default:
 *   post:
 *     summary: Set payment method as default
 *     tags: [Payment Methods]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method set as default successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaymentMethodResponse'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Payment method not found
 */
router.post('/:id/default', authenticateKeycloak, validate(getPaymentMethodSchema), paymentMethodController.setDefault);

export default router;