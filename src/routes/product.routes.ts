import { Router } from 'express';
import productController from '../controllers/product.controller';
import { authenticateKeycloak, requireRole } from '../middleware/keycloakAuth.middleware';
import { validate } from '../middleware/validation.middleware';
import {
  createProductSchema,
  updateProductSchema,
  getProductSchema,
} from '../validators/product.validator';

const router = Router();

/**
 * @route   POST /api/v1/products
 * @desc    Create product
 * @access  Public (for testing)
 */
router.post(
  '/',
  validate(createProductSchema),
  productController.create
);

// All other routes require authentication
router.use(authenticateKeycloak);

/**
 * @route   GET /api/v1/products
 * @desc    Get all products
 * @access  Private
 */
router.get('/', productController.getAll);

/**
 * @route   GET /api/v1/products/:id
 * @desc    Get product by ID
 * @access  Private
 */
router.get('/:id', validate(getProductSchema), productController.getById);

/**
 * @route   PUT /api/v1/products/:id
 * @desc    Update product
 * @access  Private (admin)
 */
router.put(
  '/:id',
  requireRole('admin'),
  validate(updateProductSchema),
  productController.update
);

/**
 * @route   DELETE /api/v1/products/:id
 * @desc    Delete product
 * @access  Private (admin)
 */
router.delete(
  '/:id',
  requireRole('admin'),
  validate(getProductSchema),
  productController.delete
);

/**
 * @route   POST /api/v1/products/:id/features/:featureId
 * @desc    Add feature to product
 * @access  Private (admin)
 */
router.post('/:id/features/:featureId', requireRole('admin'), productController.addFeature);

/**
 * @route   DELETE /api/v1/products/:id/features/:featureId
 * @desc    Remove feature from product
 * @access  Private (admin)
 */
router.delete('/:id/features/:featureId', requireRole('admin'), productController.removeFeature);

export default router;
