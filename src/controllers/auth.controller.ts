import { Response } from 'express';
import { AuthRequest } from '../middleware/keycloakAuth.middleware';
import authService from '../services/auth.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication endpoints
 */

export class AuthController {
  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: Login user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *     responses:
   *       200:
   *         description: Login successful
   */
  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password, req);
    res.json(ApiResponse.success(result, 'Login successful'));
  });

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Register new user
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *               - org_id
   *               - role_id
   *             properties:
   *               name:
   *                 type: string
   *               email:
   *                 type: string
   *               password:
   *                 type: string
   *               org_id:
   *                 type: string
   *               role_id:
   *                 type: string
   *     responses:
   *       201:
   *         description: User registered successfully
   */
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    const result = await authService.register(req.body);
    res.status(201).json(ApiResponse.success(result, 'User registered successfully'));
  });

  /**
   * @swagger
   * /auth/me:
   *   get:
   *     summary: Get current user
   *     tags: [Authentication]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Current user details
   */
  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    res.json(ApiResponse.success(req.user));
  });

  /**
   * @swagger
   * /auth/validate:
   *   post:
   *     summary: Validate JWT token
   *     tags: [Authentication]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - token
   *             properties:
   *               token:
   *                 type: string
   *     responses:
   *       200:
   *         description: Token is valid
   */
  validateToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { token } = req.body;
    const user = await authService.validateToken(token);
    res.json(ApiResponse.success(user, 'Token is valid'));
  });
}

export default new AuthController();
