import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import organizationService from '../services/organization.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Organizations
 *   description: Organization management
 */

export class OrganizationController {
  /**
   * @swagger
   * /organizations:
   *   post:
   *     summary: Create a new organization
   *     tags: [Organizations]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - slug
   *               - billing_email
   *             properties:
   *               name:
   *                 type: string
   *               slug:
   *                 type: string
   *               billing_email:
   *                 type: string
   *     responses:
   *       201:
   *         description: Organization created successfully
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const organization = await organizationService.create(req.body);
    res.status(201).json(ApiResponse.success(organization, 'Organization created successfully'));
  });

  /**
   * @swagger
   * /organizations:
   *   get:
   *     summary: Get all organizations
   *     tags: [Organizations]
   *     parameters:
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *     responses:
   *       200:
   *         description: List of organizations
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const { organizations, total } = await organizationService.findAll(undefined, page, limit);
    res.json(ApiResponse.paginated(organizations, page, limit, total));
  });

  /**
   * @swagger
   * /organizations/{id}:
   *   get:
   *     summary: Get organization by ID
   *     tags: [Organizations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Organization details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const organization = await organizationService.findById(req.params.id);
    res.json(ApiResponse.success(organization));
  });

  /**
   * @swagger
   * /organizations/{id}:
   *   put:
   *     summary: Update organization
   *     tags: [Organizations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Organization updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const organization = await organizationService.update(req.params.id, req.body);
    res.json(ApiResponse.success(organization, 'Organization updated successfully'));
  });

  /**
   * @swagger
   * /organizations/{id}:
   *   delete:
   *     summary: Delete organization
   *     tags: [Organizations]
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Organization deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await organizationService.delete(req.params.id);
    res.json(ApiResponse.success(null, 'Organization deleted successfully'));
  });
}

export default new OrganizationController();
