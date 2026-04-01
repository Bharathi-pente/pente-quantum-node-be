import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth';
import productService from '../services/product.service';
import ApiResponse from '../utils/ApiResponse';
import asyncHandler from '../utils/asyncHandler';

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

export class ProductController {
  /**
   * @swagger
   * /products:
   *   post:
   *     summary: Create a new product
   *     tags: [Products]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - org_id
   *               - base_price
   *             properties:
   *               name:
   *                 type: string
   *                 description: Product name
   *               description:
   *                 type: string
   *                 description: Product description (optional)
   *               org_id:
   *                 type: string
   *                 format: uuid
   *                 description: Organization ID
   *               base_price:
   *                 type: number
   *                 description: Base price
   *               included_units:
   *                 type: object
   *                 description: Included units (optional)
   *               status:
   *                 type: string
   *                 enum: [active, draft, archived]
   *                 description: Product status (optional)
   *     responses:
   *       201:
   *         description: Product created successfully
   */
  create = asyncHandler(async (req: Request, res: Response) => {
    const product = await productService.create(req.body);
    res.status(201).json(ApiResponse.success(product, 'Product created successfully'));
  });

  /**
   * @swagger
   * /products:
   *   get:
   *     summary: Get all products
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of products
   */
  getAll = asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    // Admins can view all products across organizations
    const effectiveOrgId = req.user!.roles?.includes('admin') ? undefined : req.user?.orgId;
    
    const filters = {
      status: req.query.status as string,
      search: req.query.search as string,
    };

    const result = await productService.findAll(effectiveOrgId, page, limit, filters);
    res.json(ApiResponse.paginated(result.data, result.pagination.page, result.pagination.limit, result.pagination.total));
  });

  /**
   * @swagger
   * /products/{id}:
   *   get:
   *     summary: Get product by ID
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Product details
   */
  getById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await productService.findById(req.params.id);
    res.json(ApiResponse.success(product));
  });

  /**
   * @swagger
   * /products/{id}:
   *   put:
   *     summary: Update product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Product updated successfully
   */
  update = asyncHandler(async (req: AuthRequest, res: Response) => {
    const product = await productService.update(req.params.id, req.body);
    res.json(ApiResponse.success(product, 'Product updated successfully'));
  });

  /**
   * @swagger
   * /products/{id}:
   *   delete:
   *     summary: Delete product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Product deleted successfully
   */
  delete = asyncHandler(async (req: AuthRequest, res: Response) => {
    await productService.delete(req.params.id);
    res.json(ApiResponse.success(null, 'Product deleted successfully'));
  });

  /**
   * @swagger
   * /products/{id}/features/{featureId}:
   *   post:
   *     summary: Add feature to product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Feature added successfully
   */
  addFeature = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, featureId } = req.params;
    const result = await productService.addFeature(id, featureId);
    res.json(ApiResponse.success(result, 'Feature added successfully'));
  });

  /**
   * @swagger
   * /products/{id}/features/{featureId}:
   *   delete:
   *     summary: Remove feature from product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Feature removed successfully
   */
  removeFeature = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id, featureId } = req.params;
    await productService.removeFeature(id, featureId);
    res.json(ApiResponse.success(null, 'Feature removed successfully'));
  });
}

export default new ProductController();
