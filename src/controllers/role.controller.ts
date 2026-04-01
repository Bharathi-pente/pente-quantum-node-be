import { Response } from 'express';
import { AuthRequest } from '../types/auth';
import roleService from '../services/role.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';
import { createRoleSchema, updateRoleSchema } from '../validators/role.validator';

/**
 * @swagger
 * tags:
 *   name: Roles
 *   description: Role management
 */

export class RoleController {
  /**
   * @swagger
   * /roles:
   *   post:
   *     summary: Create a new role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - org_id
   *             properties:
   *               name:
   *                 type: string
   *                 description: Role name
   *               description:
   *                 type: string
   *                 description: Role description
   *               org_id:
   *                 type: string
   *                 format: uuid
   *                 description: Organization ID
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: List of permissions
   *     responses:
   *       201:
   *         description: Role created successfully
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const validatedData = createRoleSchema.parse(req.body);
    const role = await roleService.create(validatedData);
    res.status(201).json(ApiResponse.success(role, 'Role created successfully'));
  });

  /**
   * @swagger
   * /roles:
   *   get:
   *     summary: Get all roles
   *     tags: [Roles]
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
   *         name: search
   *         schema:
   *           type: string
   *         description: Search term
   *     responses:
   *       200:
   *         description: List of roles
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const orgId = req.user?.orgId!;

    const { roles, total } = await roleService.findAll(orgId, page, limit, search);
    res.json(ApiResponse.paginated(roles, page, limit, total));
  });

  /**
   * @swagger
   * /roles/{id}:
   *   get:
   *     summary: Get role by ID
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       200:
   *         description: Role details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId!;
    const role = await roleService.findById(req.params.id, orgId);
    res.json(ApiResponse.success(role));
  });

  /**
   * @swagger
   * /roles/{id}:
   *   put:
   *     summary: Update role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 description: Role name
   *               description:
   *                 type: string
   *                 description: Role description
   *               permissions:
   *                 type: array
   *                 items:
   *                   type: string
   *                 description: List of permissions
   *     responses:
   *       200:
   *         description: Role updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const validatedData = updateRoleSchema.parse(req.body);
    const orgId = req.user?.orgId!;
    const role = await roleService.update(req.params.id, orgId, validatedData);
    res.json(ApiResponse.success(role, 'Role updated successfully'));
  });

  /**
   * @swagger
   * /roles/{id}:
   *   delete:
   *     summary: Delete role
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *         description: Role ID
   *     responses:
   *       204:
   *         description: Role deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId!;
    await roleService.delete(req.params.id, orgId);
    res.status(204).json(ApiResponse.success(null, 'Role deleted successfully'));
  });

  /**
   * @swagger
   * /roles/permissions:
   *   get:
   *     summary: Get available permissions
   *     tags: [Roles]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of available permissions
   */
  getPermissions = asyncHandler(async (req: AuthRequest, res: Response) => {
    const orgId = req.user?.orgId!;
    const permissions = await roleService.getPermissions(orgId);
    res.json(ApiResponse.success(permissions));
  });
}

export default new RoleController();