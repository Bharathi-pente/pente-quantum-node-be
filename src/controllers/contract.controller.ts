import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import contractService from '../services/contract.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Contracts
 *   description: Contract management
 */

export class ContractController {
  /**
   * @swagger
   * /contracts:
   *   post:
   *     summary: Create a new contract
   *     tags: [Contracts]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - customer_id
   *               - name
   *               - contract_type
   *               - start_date
   *             properties:
   *               customer_id:
   *                 type: string
   *                 format: uuid
   *                 description: Customer ID
   *               name:
   *                 type: string
   *                 description: Contract name
   *               contract_type:
   *                 type: string
   *                 enum: [prepaid, postpaid]
   *                 description: Contract type
   *               start_date:
   *                 type: string
   *                 format: date
   *                 description: Contract start date
   *               end_date:
   *                 type: string
   *                 format: date
   *                 description: Contract end date (optional)
   *               total_value:
   *                 type: number
   *                 description: Total contract value
   *               commit_amount:
   *                 type: number
   *                 description: Committed amount
   *               rate_card_id:
   *                 type: string
   *                 format: uuid
   *                 description: Rate card ID (optional)
   *               auto_renew:
   *                 type: boolean
   *                 description: Auto renew flag
   *               payment_terms:
   *                 type: string
   *                 description: Payment terms
   *               status:
   *                 type: string
   *                 enum: [active, expired, cancelled, draft]
   *                 description: Contract status
   *     responses:
   *       201:
   *         description: Contract created successfully
   *       400:
   *         description: Invalid input data
   *       404:
   *         description: Customer or rate card not found
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId!;
    const contractData = { ...req.body, org_id: orgId };

    const contract = await contractService.create(contractData);
    res.status(201).json(ApiResponse.success(contract, 'Contract created successfully'));
  });

  /**
   * @swagger
   * /contracts:
   *   get:
   *     summary: Get all contracts for the organization
   *     tags: [Contracts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *         description: Page number
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *         description: Items per page
   *       - in: query
   *         name: status
   *         schema:
   *           type: string
   *         description: Filter by status
   *       - in: query
   *         name: contract_type
   *         schema:
   *           type: string
   *         description: Filter by contract type
   *       - in: query
   *         name: customer_id
   *         schema:
   *           type: string
   *         description: Filter by customer ID
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search in contract name, customer name, or email
   *     responses:
   *       200:
   *         description: List of contracts
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orgId = req.user?.orgId!;
    const filters = {
      status: req.query.status as string,
      contract_type: req.query.contract_type as string,
      customer_id: req.query.customer_id as string,
      search: req.query.search as string,
    };

    const { contracts, total } = await contractService.findAll(orgId, page, limit, filters);
    res.json(ApiResponse.paginated(contracts, page, limit, total));
  });

  /**
   * @swagger
   * /contracts/{id}:
   *   get:
   *     summary: Get contract by ID
   *     tags: [Contracts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Contract ID
   *     responses:
   *       200:
   *         description: Contract details
   *       404:
   *         description: Contract not found
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId!;

    const contract = await contractService.findById(id, orgId);
    res.json(ApiResponse.success(contract, 'Contract retrieved successfully'));
  });

  /**
   * @swagger
   * /contracts/{id}:
   *   put:
   *     summary: Update contract
   *     tags: [Contracts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Contract ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Contract name
   *               contract_type:
   *                 type: string
   *                 enum: [prepaid, postpaid]
   *                 description: Contract type
   *               start_date:
   *                 type: string
   *                 format: date
   *                 description: Contract start date
   *               end_date:
   *                 type: string
   *                 format: date
   *                 description: Contract end date
   *               total_value:
   *                 type: number
   *                 description: Total contract value
   *               commit_amount:
   *                 type: number
   *                 description: Committed amount
   *               used_amount:
   *                 type: number
   *                 description: Used amount
   *               remaining_amount:
   *                 type: number
   *                 description: Remaining amount
   *               rate_card_id:
   *                 type: string
   *                 format: uuid
   *                 description: Rate card ID
   *               auto_renew:
   *                 type: boolean
   *                 description: Auto renew flag
   *               payment_terms:
   *                 type: string
   *                 description: Payment terms
   *               status:
   *                 type: string
   *                 enum: [active, expired, cancelled, draft]
   *                 description: Contract status
   *     responses:
   *       200:
   *         description: Contract updated successfully
   *       404:
   *         description: Contract not found
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId!;

    const contract = await contractService.update(id, orgId, req.body);
    res.json(ApiResponse.success(contract, 'Contract updated successfully'));
  });

  /**
   * @swagger
   * /contracts/{id}:
   *   delete:
   *     summary: Delete contract
   *     tags: [Contracts]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *         description: Contract ID
   *     responses:
   *       200:
   *         description: Contract deleted successfully
   *       404:
   *         description: Contract not found
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const orgId = req.user?.orgId!;

    const result = await contractService.delete(id, orgId);
    res.json(ApiResponse.success(result.message));
  });
}

export default new ContractController();