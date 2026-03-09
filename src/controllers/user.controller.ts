import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import userService from '../services/user.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management
 */

export class UserController {
  /**
   * @swagger
   * /users:
   *   post:
   *     summary: Create a new user
   *     tags: [Users]
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
   *               - role_id
   *             properties:
   *               name:
   *                 type: string
   *                 description: User name
   *               email:
   *                 type: string
   *                 format: email
   *                 description: User email
   *               password:
   *                 type: string
   *                 minLength: 8
   *                 description: User password (optional)
   *               org_id:
   *                 type: string
   *                 format: uuid
   *                 description: Organization ID
   *               role_id:
   *                 type: string
   *                 format: uuid
   *                 description: Role ID
   *               status:
   *                 type: string
   *                 enum: [active, invited, deactivated]
   *                 description: User status (optional)
   *     responses:
   *       201:
   *         description: User created successfully
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.create(req.body);
    res.status(201).json(ApiResponse.success(user, 'User created successfully'));
  });

  /**
   * @swagger
   * /users:
   *   get:
   *     summary: Get all users in organization
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of users
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const status = req.query.status as string;
    const role_id = req.query.role_id as string;
    const orgId = req.user?.orgId!;

    const filters: any = {};
    if (status) filters.status = status;
    if (role_id) filters.role_id = role_id;

    const { users, total } = await userService.findAll(orgId, page, limit, search, Object.keys(filters).length > 0 ? filters : undefined);
    res.json(ApiResponse.paginated(users, page, limit, total));
  });

  /**
   * @swagger
   * /users/{id}:
   *   get:
   *     summary: Get user by ID
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: User details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await userService.findById(req.params.id);
    res.json(ApiResponse.success(user));
  });

  /**
   * @swagger
   * /users/{id}:
   *   put:
   *     summary: Update user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const user = await userService.update(req.params.id, req.body);
    res.json(ApiResponse.success(user, 'User updated successfully'));
  });

  /**
   * @swagger
   * /users/{id}:
   *   delete:
   *     summary: Delete user
   *     tags: [Users]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: User deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await userService.delete(req.params.id);
    res.json(ApiResponse.success(null, 'User deleted successfully'));
  });
}

export default new UserController();
