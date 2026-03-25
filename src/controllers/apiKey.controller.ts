import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import apiKeyService from '../services/apiKey.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: API Keys
 *   description: API key management for users
 */

export class ApiKeyController {
  /**
   * @swagger
   * /user/apikeys:
   *   post:
   *     summary: Create a new API key
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
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
   *                 example: Production API Key
   *               org_id:
   *                 type: string
   *                 format: uuid
   *               environment:
   *                 type: string
   *                 enum: [production, development, staging]
   *                 example: production
   *               scopes:
   *                 type: array
   *                 items:
   *                   type: string
   *     responses:
   *       201:
   *         description: API key created successfully
   *       400:
   *         description: Invalid parameters
   *       401:
   *         description: Unauthorized
   */
  create = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = await apiKeyService.create(req.body, req);
    res.status(201).json(
      ApiResponse.success(apiKey, 'API key created successfully. Save the key securely - it will not be shown again.')
    );
  });

  /**
   * @swagger
   * /user/apikeys:
   *   get:
   *     summary: Get all API keys with pagination
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: query
   *         name: org_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *       - in: query
   *         name: page
   *         schema:
   *           type: integer
   *           default: 1
   *       - in: query
   *         name: limit
   *         schema:
   *           type: integer
   *           default: 10
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: List of API keys
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const orgId = req.user?.orgId!;
    const filters = {
      status: req.query.status as string,
      environment: req.query.environment as string,
      search: req.query.search as string,
    };

    const { apiKeys, total } = await apiKeyService.findAll(orgId, page, limit, filters);

    return res.json(ApiResponse.paginated(apiKeys, page, limit, total));
  });

  /**
   * @swagger
   * /user/apikeys/{id}:
   *   get:
   *     summary: Get API key by ID
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: org_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: API key details
   *       404:
   *         description: API key not found
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = await apiKeyService.findById(req.params.id);
    res.json(ApiResponse.success(apiKey));
  });

  /**
   * @swagger
   * /user/apikeys/{id}:
   *   put:
   *     summary: Update API key
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               org_id:
   *                 type: string
   *                 format: uuid
   *               name:
   *                 type: string
   *               scopes:
   *                 type: array
   *                 items:
   *                   type: string
   *               status:
   *                 type: string
   *                 enum: [active, revoked]
   *     responses:
   *       200:
   *         description: API key updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = await apiKeyService.update(req.params.id, req.body);
    res.json(ApiResponse.success(apiKey, 'API key updated successfully'));
  });

  /**
   * @swagger
   * /user/apikeys/{id}/revoke:
   *   post:
   *     summary: Revoke an API key
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - org_id
   *             properties:
   *               org_id:
   *                 type: string
   *                 format: uuid
   *     responses:
   *       200:
   *         description: API key revoked successfully
   */
  revoke = asyncHandler(async (req: AuthRequest, res: Response) => {
    const apiKey = await apiKeyService.revoke(req.params.id);
    res.json(ApiResponse.success(apiKey, 'API key revoked successfully'));
  });

  /**
   * @swagger
   * /user/apikeys/{id}:
   *   delete:
   *     summary: Delete an API key
   *     tags: [API Keys]
   *     security:
   *       - BearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *       - in: query
   *         name: org_id
   *         required: true
   *         schema:
   *           type: string
   *           format: uuid
   *     responses:
   *       200:
   *         description: API key deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await apiKeyService.delete(req.params.id);
    res.json(ApiResponse.success(null, 'API key deleted successfully'));
  });
}

export default new ApiKeyController();
