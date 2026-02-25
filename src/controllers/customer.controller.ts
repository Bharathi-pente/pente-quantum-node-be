import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import customerService from '../services/customer.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management
 */

export class CustomerController {
  /**
   * @swagger
   * /customers:
   *   post:
   *     summary: Create a new customer
   *     tags: [Customers]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - org_id
   *             properties:
   *               name:
   *                 type: string
   *                 description: Customer name
   *               email:
   *                 type: string
   *                 format: email
   *                 description: Customer email
   *               org_id:
   *                 type: string
   *                 format: uuid
   *                 description: Organization ID
   *               product_id:
   *                 type: string
   *                 format: uuid
   *                 description: Product ID (optional)
   *               status:
   *                 type: string
   *                 enum: [active, trial, churned, suspended]
   *                 description: Customer status (optional)
   *               mrr:
   *                 type: number
   *                 description: Monthly recurring revenue (optional)
   *               credit_balance:
   *                 type: number
   *                 description: Credit balance (optional)
   *               health_score:
   *                 type: number
   *                 minimum: 0
   *                 maximum: 100
   *                 description: Health score (optional)
   *     responses:
   *       201:
   *         description: Customer created successfully
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const customer = await customerService.create(req.body);
    res.status(201).json(ApiResponse.success(customer, 'Customer created successfully'));
  });

  /**
   * @swagger
   * /customers:
   *   get:
   *     summary: Get all customers
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of customers
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    // Use orgId from params if provided (for admin accessing other orgs), otherwise use user's orgId
    const orgId = req.params.id || req.user?.orgId!;
    const filters = {
      status: req.query.status as string,
      product_id: req.query.product_id as string,
      search: req.query.search as string,
    };

    const { customers, total } = await customerService.findAll(orgId, page, limit, filters);
    res.json(ApiResponse.paginated(customers, page, limit, total));
  });

  /**
   * @swagger
   * /customers/{id}:
   *   get:
   *     summary: Get customer by ID
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Customer details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await customerService.findById(req.params.id);
    res.json(ApiResponse.success(customer));
  });

  /**
   * @swagger
   * /customers/{id}:
   *   put:
   *     summary: Update customer
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Customer updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const customer = await customerService.update(req.params.id, req.body);
    res.json(ApiResponse.success(customer, 'Customer updated successfully'));
  });

  /**
   * @swagger
   * /customers/{id}:
   *   delete:
   *     summary: Delete customer
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Customer deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await customerService.delete(req.params.id);
    res.json(ApiResponse.success(null, 'Customer deleted successfully'));
  });

  /**
   * @swagger
   * /customers/stats:
   *   get:
   *     summary: Get customer statistics
   *     tags: [Customers]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Customer statistics
   */
  getStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId!;
    const stats = await customerService.getStats(orgId);
    res.json(ApiResponse.success(stats));
  });
}

export default new CustomerController();
